import {
  DEFAULT_TIGHT_GAP,
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
  WalkOptions,
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

function rightEdge(rect: Rect): number {
  return rect.x + rect.width;
}

function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const width = Math.max(rightEdge(a), rightEdge(b)) - x;
  const height = Math.max(a.y + a.height, b.y + b.height) - y;

  return { x, y, width, height };
}

function byPosition(a: Rect, b: Rect): number {
  return a.y - b.y || a.x - b.x;
}

function horizontalGap(a: Rect, b: Rect): number {
  return Math.max(a.x, b.x) - Math.min(rightEdge(a), rightEdge(b));
}

function isOnSameLine(a: Rect, b: Rect): boolean {
  const verticalOverlap =
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

  return verticalOverlap >= Math.min(a.height, b.height) / 2;
}

function canMerge(a: Rect, b: Rect, mergeGap: number): boolean {
  const gap = horizontalGap(a, b);

  return isOnSameLine(a, b) && (gap <= mergeGap || gap < 0);
}

function mergeFirstPair(bones: Bone[], mergeGap: number): boolean {
  for (const [index, bone] of bones.entries()) {
    const partnerIndex = bones.findIndex(
      (other, otherIndex) =>
        otherIndex > index && canMerge(bone, other, mergeGap)
    );
    const partner = bones[partnerIndex];

    if (partner) {
      bones.splice(partnerIndex, 1);
      bones[index] = union(bone, partner);
      return true;
    }
  }

  return false;
}

function mergeLineBones(bones: Bone[], mergeGap: number): Bone[] {
  const merged = [...bones].sort(byPosition);

  while (mergeFirstPair(merged, mergeGap)) {
    merged.sort(byPosition);
  }

  return merged;
}

function hasTightChildren(children: Rect[], maxGap: number): boolean {
  const visibleChildren = children
    .filter((child) => child.width > 0 && child.height > 0)
    .sort((a, b) => a.x - b.x);

  return visibleChildren.every(
    (child, index) =>
      index === 0 ||
      child.x - Math.max(...visibleChildren.slice(0, index).map(rightEdge)) <=
        maxGap
  );
}

function rectMeasurer<Node extends SkeletonNode<Node>>() {
  const rects = new Map<Node, Rect>();

  return (node: Node): Rect => {
    const cached = rects.get(node);

    if (cached) {
      return cached;
    }

    const rect = node.getBoundingClientRect();
    rects.set(node, rect);
    return rect;
  };
}

function shouldCollapse<Node extends SkeletonNode<Node>>(
  rect: Rect,
  children: Node[],
  { collapseBelow, mergeGap }: WalkOptions,
  measure: (node: Node) => Rect
): boolean {
  return (
    collapseBelow !== undefined &&
    rect.height > 0 &&
    rect.height <= collapseBelow &&
    hasTightChildren(children.map(measure), mergeGap ?? DEFAULT_TIGHT_GAP)
  );
}

function isWithinSurfaceDepth(
  surfaceLayer: number | null,
  surfaceDepth: number | undefined
): boolean {
  return (
    surfaceDepth === undefined ||
    surfaceLayer === null ||
    surfaceLayer <= surfaceDepth
  );
}

function childSurfaceLayer<Node>(
  node: Node,
  surfaceLayer: number | null,
  traits: NodeTraits<Node>
): number | null {
  if (traits.hasBorder(node)) {
    return 1;
  }

  return surfaceLayer === null ? null : surfaceLayer + 1;
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
  depth: number,
  surfaceLayer: number | null
): QueueEntry<Node>[] {
  return nodes.map((node) => ({ node, clip, depth, surfaceLayer }));
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

function hasBorderedEdge(node: HostNode): boolean {
  return (node.clientTop ?? 0) > 0 || (node.clientLeft ?? 0) > 0;
}

const HOST_TRAITS: NodeTraits<HostNode> = {
  isScrollable: isScrollableNode,
  isAtomic: isAtomicNode,
  hasBorder: hasBorderedEdge,
};

export function collectBones<Node extends SkeletonNode<Node>>(
  root: Node,
  traits: NodeTraits<Node>,
  walkOptions: WalkOptions
): Bone[] {
  const { maxLayer, mergeGap, surfaceDepth } = walkOptions;
  const measuredBones: Bone[] = [];
  const fallbackCandidates: Bone[] = [];
  const measure = rectMeasurer<Node>();
  const queue = withClip(
    Array.from(root.children),
    root.getBoundingClientRect(),
    1,
    null
  );

  for (const { node, clip, depth, surfaceLayer } of queue) {
    const rect = measure(node);
    const children = Array.from(node.children);
    const canExpand =
      depth <= maxLayer && isWithinSurfaceDepth(surfaceLayer, surfaceDepth);
    const nextSurfaceLayer = childSurfaceLayer(node, surfaceLayer, traits);

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

      queue.push(
        ...withClip(populatedChildren, scrollClip, depth + 1, nextSurfaceLayer)
      );
    } else if (
      canExpand &&
      children.length > 0 &&
      !traits.isAtomic(node) &&
      !shouldCollapse(rect, children, walkOptions, measure)
    ) {
      queue.push(...withClip(children, clip, depth + 1, nextSurfaceLayer));
    } else if (rect.width > 0 && rect.height > 0) {
      pushWhenVisible(measuredBones, intersect(rect, clip));
    } else {
      pushWhenVisible(
        fallbackCandidates,
        intersect(withFallbackSize(rect), clip)
      );
    }
  }

  const bones = withAcceptedFallbacks(measuredBones, fallbackCandidates);

  return mergeGap === undefined ? bones : mergeLineBones(bones, mergeGap);
}

export function collectHostBones(
  container: HostNode,
  origin: Rect,
  walkOptions: WalkOptions
): Bone[] {
  return collectBones(container, HOST_TRAITS, walkOptions).map((bone) => ({
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
