export type Rect = {
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
  hasBorder: (node: Node) => boolean;
};

export type QueueEntry<Node> = {
  node: Node;
  clip: Rect;
  depth: number;
  surfaceLayer: number | null;
};

export interface HostNode extends SkeletonNode<HostNode> {
  tagName: string;
  childNodes: ArrayLike<{ nodeType: number }>;
  clientTop?: number;
  clientLeft?: number;
}

export type ComputedOverflow = {
  overflowX: string;
  overflowY: string;
};

export type SkeletonAnimation = 'pulse' | 'none';

export type SkeletonOptions = {
  boneColor?: string;
  boneBorderRadius?: number;
  animation?: SkeletonAnimation;
  fadeSwap?: boolean;
  maxLayer?: number;
  mergeGap?: number;
  collapseBelow?: number;
  surfaceDepth?: number;
};

export interface SkeletonPresets {}

export type SkeletonPresetName = keyof SkeletonPresets extends never
  ? string
  : Extract<keyof SkeletonPresets, string>;

export type PresetSelection = {
  preset?: SkeletonPresetName;
};

export type ResolvedSkeletonOptions = SkeletonOptions & {
  boneColor: string;
  boneBorderRadius: number;
  animation: SkeletonAnimation;
  fadeSwap: boolean;
  maxLayer: number;
};

export type WalkOptions = {
  maxLayer: number;
  mergeGap?: number;
  collapseBelow?: number;
  surfaceDepth?: number;
};
