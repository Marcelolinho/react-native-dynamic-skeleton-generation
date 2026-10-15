import {
  FALLBACK_BONE_HEIGHT,
  FALLBACK_BONE_WIDTH,
  LIST_ITEM_HEIGHT,
  NATIVE_SCROLL_TAG_FRAGMENT,
  NATIVE_TEXT_TAG,
  SCROLLING_OVERFLOWS,
  TEXT_NODE_TYPE,
} from './constants';
import type {
  Bone,
  ComputedOverflow,
  HostNode,
  NodeTraits,
  QueueEntry,
  Rect,
  SkeletonNode,
} from './types';

declare const getComputedStyle:
  ((node: HostNode) => ComputedOverflow) | undefined;

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

function withClip<Node>(
  nodes: Node[],
  clip: Rect,
  depth: number
): QueueEntry<Node>[] {
  return nodes.map((node) => ({ node, clip, depth }));
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

export function collectBones<Node extends SkeletonNode<Node>>(
  root: Node,
  traits: NodeTraits<Node>,
  maxLayer: number
): Bone[] {
  const measuredBones: Bone[] = [];
  const fallbackCandidates: Bone[] = [];
  const queue = withClip(
    Array.from(root.children),
    root.getBoundingClientRect(),
    1
  );

  for (const { node, clip, depth } of queue) {
    const rect = node.getBoundingClientRect();
    const children = Array.from(node.children);
    const canExpand = depth <= maxLayer;

    if (canExpand && traits.isScrollable(node)) {
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

      queue.push(...withClip(populatedChildren, scrollClip, depth + 1));
    } else if (canExpand && children.length > 0 && !traits.isAtomic(node)) {
      queue.push(...withClip(children, clip, depth + 1));
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

export function collectHostBones(
  container: HostNode,
  origin: Rect,
  maxLayer: number
): Bone[] {
  return collectBones(container, HOST_TRAITS, maxLayer).map((bone) => ({
    ...bone,
    x: bone.x - origin.x,
    y: bone.y - origin.y,
  }));
}

export function areBonesEqual(a: Bone[], b: Bone[]): boolean {
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
