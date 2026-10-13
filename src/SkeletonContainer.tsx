import { useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { HostInstance, StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeOut, useAnimatedRef } from 'react-native-reanimated';
import type { CSSAnimationProperties, CSSStyle } from 'react-native-reanimated';

export type SkeletonAnimation = 'pulse' | 'none';

export type SkeletonContainerProps = {
  isLoading: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  boneColor?: string;
  boneBorderRadius?: number;
  animation?: SkeletonAnimation;
  fadeSwap?: boolean;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Bone = Rect;

export type SkeletonNode<Node> = {
  children: ArrayLike<Node>;
  getBoundingClientRect(): Rect;
};

export type NodeTraits<Node> = {
  isScrollable: (node: Node) => boolean;
  isAtomic: (node: Node) => boolean;
};

type QueueEntry<Node> = {
  node: Node;
  clip: Rect;
};

interface HostNode extends SkeletonNode<HostNode> {
  tagName: string;
  childNodes: ArrayLike<{ nodeType: number }>;
}

type ComputedOverflow = {
  overflowX: string;
  overflowY: string;
};

declare const getComputedStyle:
  ((node: HostNode) => ComputedOverflow) | undefined;

const LIST_ITEM_HEIGHT = 48;
const FALLBACK_BONE_WIDTH = 120;
const FALLBACK_BONE_HEIGHT = 16;
const FADE_DURATION_MS = 200;
const PULSE_DURATION_MS = 800;
const PULSE_MIN_OPACITY = 0.4;
const DEFAULT_BONE_COLOR = '#E1E9EE';
const DEFAULT_BONE_BORDER_RADIUS = 4;
const NATIVE_SCROLL_TAG_FRAGMENT = 'ScrollView';
const NATIVE_TEXT_TAG = 'RN:Paragraph';
const TEXT_NODE_TYPE = 3;
const SCROLLING_OVERFLOWS = ['auto', 'scroll'];

const PULSE_STYLE: CSSAnimationProperties = {
  animationName: {
    from: { opacity: 1 },
    to: { opacity: PULSE_MIN_OPACITY },
  },
  animationDuration: PULSE_DURATION_MS,
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
};

function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;

  return width > 0 && height > 0 ? { x, y, width, height } : null;
}

function overlaps(a: Rect, b: Rect): boolean {
  return intersect(a, b) !== null;
}

function listItemBone(clip: Rect): Bone | null {
  return intersect({ ...clip, height: LIST_ITEM_HEIGHT }, clip);
}

function withFallbackSize(rect: Rect): Rect {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width > 0 ? rect.width : FALLBACK_BONE_WIDTH,
    height: rect.height > 0 ? rect.height : FALLBACK_BONE_HEIGHT,
  };
}

function areBonesEqual(a: Bone[], b: Bone[]): boolean {
  return (
    a.length === b.length &&
    a.every((bone, index) => {
      const other = b[index];

      return (
        other !== undefined &&
        bone.x === other.x &&
        bone.y === other.y &&
        bone.width === other.width &&
        bone.height === other.height
      );
    })
  );
}

function withClip<Node>(nodes: Node[], clip: Rect): QueueEntry<Node>[] {
  return nodes.map((node) => ({ node, clip }));
}

function pushWhenVisible(bones: Bone[], bone: Bone | null) {
  if (bone) {
    bones.push(bone);
  }
}

function withAcceptedFallbacks(
  measuredBones: Bone[],
  fallbackCandidates: Bone[]
): Bone[] {
  const bones = [...measuredBones];

  for (const candidate of fallbackCandidates) {
    if (!bones.some((bone) => overlaps(bone, candidate))) {
      bones.push(candidate);
    }
  }

  return bones;
}

export function collectBones<Node extends SkeletonNode<Node>>(
  root: Node,
  traits: NodeTraits<Node>
): Bone[] {
  const measuredBones: Bone[] = [];
  const fallbackCandidates: Bone[] = [];
  const queue = withClip(
    Array.from(root.children),
    root.getBoundingClientRect()
  );

  for (const { node, clip } of queue) {
    const rect = node.getBoundingClientRect();
    const children = Array.from(node.children);

    if (traits.isScrollable(node)) {
      const scrollClip = intersect(clip, rect);

      if (!scrollClip) {
        continue;
      }

      const populatedChildren = children.filter(
        (child) => child.children.length > 0 || traits.isAtomic(child)
      );

      const hasEmptyContent =
        children.length === 0 || populatedChildren.length < children.length;

      if (hasEmptyContent) {
        pushWhenVisible(measuredBones, listItemBone(scrollClip));
      }

      queue.push(...withClip(populatedChildren, scrollClip));
    } else if (children.length > 0 && !traits.isAtomic(node)) {
      queue.push(...withClip(children, clip));
    } else if (rect.width > 0 && rect.height > 0) {
      pushWhenVisible(measuredBones, intersect(rect, clip));
    } else {
      pushWhenVisible(
        fallbackCandidates,
        intersect(withFallbackSize(rect), clip)
      );
    }
  }

  return withAcceptedFallbacks(measuredBones, fallbackCandidates);
}

function hasScrollingOverflow(node: HostNode): boolean {
  if (typeof getComputedStyle !== 'function') {
    return false;
  }

  const { overflowX, overflowY } = getComputedStyle(node);

  return (
    SCROLLING_OVERFLOWS.includes(overflowX) ||
    SCROLLING_OVERFLOWS.includes(overflowY)
  );
}

function isScrollableNode(node: HostNode): boolean {
  return (
    node.tagName.includes(NATIVE_SCROLL_TAG_FRAGMENT) ||
    hasScrollingOverflow(node)
  );
}

function isAtomicNode(node: HostNode): boolean {
  return (
    node.tagName === NATIVE_TEXT_TAG ||
    Array.from(node.childNodes).some(
      (child) => child.nodeType === TEXT_NODE_TYPE
    )
  );
}

const HOST_TRAITS: NodeTraits<HostNode> = {
  isScrollable: isScrollableNode,
  isAtomic: isAtomicNode,
};

export function SkeletonContainer({
  isLoading,
  children,
  style,
  boneColor = DEFAULT_BONE_COLOR,
  boneBorderRadius = DEFAULT_BONE_BORDER_RADIUS,
  animation = 'pulse',
  fadeSwap = false,
}: SkeletonContainerProps) {
  const containerRef = useAnimatedRef<HostInstance>();
  const [bones, setBones] = useState<Bone[]>([]);

  function measureBones() {
    const container = containerRef.current;
    const parent = container?.parentElement;

    if (!isLoading || !container || !parent) {
      return;
    }

    const origin = parent.getBoundingClientRect();
    const measuredBones = collectBones<HostNode>(container, HOST_TRAITS).map(
      (bone) => ({ ...bone, x: bone.x - origin.x, y: bone.y - origin.y })
    );

    setBones((currentBones) =>
      areBonesEqual(currentBones, measuredBones) ? currentBones : measuredBones
    );
  }

  function renderBone(bone: Bone, index: number) {
    return (
      <View
        key={index}
        style={[
          styles.bone,
          {
            left: bone.x,
            top: bone.y,
            width: bone.width,
            height: bone.height,
            backgroundColor: boneColor,
            borderRadius: boneBorderRadius,
          },
        ]}
      />
    );
  }

  const contentVisibility: CSSStyle<ViewStyle> = {
    opacity: isLoading ? 0 : 1,
    transitionProperty: 'opacity',
    transitionDuration: fadeSwap ? FADE_DURATION_MS : 0,
  };

  useLayoutEffect(measureBones);

  return (
    <>
      <Animated.View
        ref={containerRef}
        onLayout={measureBones}
        style={[style, contentVisibility]}
        pointerEvents={isLoading ? 'none' : 'auto'}
        accessibilityElementsHidden={isLoading}
        importantForAccessibility={isLoading ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </Animated.View>
      {isLoading && (
        <Animated.View
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          exiting={fadeSwap ? FadeOut.duration(FADE_DURATION_MS) : undefined}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              animation === 'pulse' ? PULSE_STYLE : undefined,
            ]}
          >
            {bones.map(renderBone)}
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bone: {
    position: 'absolute',
  },
});
