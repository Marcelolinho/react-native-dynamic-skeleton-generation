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
};

export type QueueEntry<Node> = {
  node: Node;
  clip: Rect;
  depth: number;
};

export interface HostNode extends SkeletonNode<HostNode> {
  tagName: string;
  childNodes: ArrayLike<{ nodeType: number }>;
}

export type ComputedOverflow = {
  overflowX: string;
  overflowY: string;
};
