import { describe, expect, it, jest } from '@jest/globals';
import { collectBones } from '../SkeletonContainer';
import type { Bone, NodeTraits } from '../SkeletonContainer';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

type FakeNodeFlags = {
  isScrollable?: boolean;
  isAtomic?: boolean;
};

type FakeNode = FakeNodeFlags & {
  children: FakeNode[];
  getBoundingClientRect: () => Bone;
};

const traits: NodeTraits<FakeNode> = {
  isScrollable: (node) => node.isScrollable === true,
  isAtomic: (node) => node.isAtomic === true,
};

function rect(x: number, y: number, width: number, height: number): Bone {
  return { x, y, width, height };
}

function fakeNode(
  bounds: Bone,
  children: FakeNode[] = [],
  flags: FakeNodeFlags = {}
): FakeNode {
  return { ...flags, children, getBoundingClientRect: () => bounds };
}

function collect(root: FakeNode): Bone[] {
  return collectBones(root, traits);
}

describe('collectBones', () => {
  it('produces one bone per flat leaf with its measured rect', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(10, 10, 100, 20)),
      fakeNode(rect(10, 40, 200, 20)),
    ]);

    expect(collect(root)).toEqual([
      rect(10, 10, 100, 20),
      rect(10, 40, 200, 20),
    ]);
  });

  it('traverses nested containers and only turns leaves into bones', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 0, 300, 100), [
        fakeNode(rect(0, 0, 300, 50), [fakeNode(rect(10, 10, 40, 40))]),
        fakeNode(rect(60, 10, 120, 20)),
      ]),
    ]);

    expect(collect(root)).toEqual([
      rect(60, 10, 120, 20),
      rect(10, 10, 40, 40),
    ]);
  });

  it('treats an atomic node with children as a single bone', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(10, 10, 200, 40), [fakeNode(rect(10, 10, 50, 20))], {
        isAtomic: true,
      }),
    ]);

    expect(collect(root)).toEqual([rect(10, 10, 200, 40)]);
  });

  it('yields no bones for a root without children', () => {
    expect(collect(fakeNode(rect(0, 0, 300, 600)))).toEqual([]);
  });

  it('cuts leaves to their scrollable ancestor and drops the ones outside it', () => {
    const content = fakeNode(rect(0, 100, 300, 1000), [
      fakeNode(rect(10, 280, 100, 40)),
      fakeNode(rect(10, 400, 100, 40)),
    ]);
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 100, 300, 200), [content], { isScrollable: true }),
    ]);

    expect(collect(root)).toEqual([rect(10, 280, 100, 20)]);
  });

  it('adds a single item bone to a scrollable node with an empty content container', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 100, 300, 200), [fakeNode(rect(0, 100, 300, 0))], {
        isScrollable: true,
      }),
    ]);

    expect(collect(root)).toEqual([rect(0, 100, 300, 48)]);
  });

  it('cuts the item bone of a scrollable node without children to the visible area', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 580, 300, 200), [], { isScrollable: true }),
    ]);

    expect(collect(root)).toEqual([rect(0, 580, 300, 20)]);
  });

  it('traverses a populated scrollable node without adding a list bone', () => {
    const content = fakeNode(rect(0, 100, 300, 200), [
      fakeNode(rect(10, 110, 100, 20)),
    ]);
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 100, 300, 200), [content], { isScrollable: true }),
    ]);

    expect(collect(root)).toEqual([rect(10, 110, 100, 20)]);
  });

  it('replaces only the collapsed axis of a zero-size leaf', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(10, 10, 0, 22)),
      fakeNode(rect(10, 100, 80, 0)),
    ]);

    expect(collect(root)).toEqual([
      rect(10, 10, 120, 22),
      rect(10, 100, 80, 16),
    ]);
  });

  it('collapses stacked zero-size siblings into one fallback bone', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(10, 10, 0, 0)),
      fakeNode(rect(10, 10, 0, 0)),
      fakeNode(rect(10, 10, 0, 0)),
    ]);

    expect(collect(root)).toEqual([rect(10, 10, 120, 16)]);
  });

  it('drops a fallback overlapping a measured bone found later in the walk', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(10, 10, 0, 0)),
      fakeNode(rect(0, 0, 300, 100), [fakeNode(rect(20, 15, 60, 30))]),
    ]);

    expect(collect(root)).toEqual([rect(20, 15, 60, 30)]);
  });
});
