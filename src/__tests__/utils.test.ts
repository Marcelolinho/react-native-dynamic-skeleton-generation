import { describe, expect, it } from '@jest/globals';
import { collectBones } from '../utils';
import type { Bone, NodeTraits, WalkOptions } from '../types';

type FakeNodeFlags = {
  isScrollable?: boolean;
  isAtomic?: boolean;
  hasBorder?: boolean;
};

type FakeNode = FakeNodeFlags & {
  children: FakeNode[];
  getBoundingClientRect: () => Bone;
};

const traits: NodeTraits<FakeNode> = {
  isScrollable: (node) => node.isScrollable === true,
  isAtomic: (node) => node.isAtomic === true,
  hasBorder: (node) => node.hasBorder === true,
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

function fixtureTree(): FakeNode {
  return fakeNode(rect(0, 0, 360, 800), [
    fakeNode(rect(16, 16, 328, 44), [
      fakeNode(rect(16, 26, 24, 24)),
      fakeNode(rect(48, 28, 200, 20)),
      fakeNode(rect(320, 28, 16, 20)),
    ]),
    fakeNode(
      rect(16, 76, 328, 200),
      [
        fakeNode(rect(32, 92, 296, 24), [], { isAtomic: true }),
        fakeNode(rect(32, 124, 296, 120), [
          fakeNode(rect(32, 124, 140, 44), [
            fakeNode(rect(40, 134, 20, 20)),
            fakeNode(rect(64, 136, 80, 16)),
          ]),
          fakeNode(rect(184, 124, 140, 44)),
        ]),
      ],
      { hasBorder: true }
    ),
    fakeNode(rect(16, 292, 328, 0)),
    fakeNode(
      rect(0, 300, 360, 300),
      [
        fakeNode(rect(0, 300, 360, 600), [
          fakeNode(rect(16, 316, 328, 48), [], { isAtomic: true }),
          fakeNode(rect(16, 380, 328, 48), [], { isAtomic: true }),
        ]),
      ],
      { isScrollable: true }
    ),
  ]);
}

function collect(root: FakeNode, options: Partial<WalkOptions> = {}): Bone[] {
  return collectBones(root, traits, { maxLayer: Infinity, ...options });
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

  it('turns the first node below the max layer into a single bone', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 0, 300, 300), [
        fakeNode(rect(10, 10, 280, 200), [
          fakeNode(rect(20, 20, 200, 100), [fakeNode(rect(30, 30, 50, 20))]),
        ]),
      ]),
    ]);

    expect(collect(root, { maxLayer: 2 })).toEqual([rect(20, 20, 200, 100)]);
  });

  it('turns every top-level child into a bone when the max layer is zero', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 0, 300, 100), [fakeNode(rect(10, 10, 50, 20))]),
      fakeNode(rect(0, 120, 300, 100), [fakeNode(rect(10, 130, 50, 20))]),
    ]);

    expect(collect(root, { maxLayer: 0 })).toEqual([
      rect(0, 0, 300, 100),
      rect(0, 120, 300, 100),
    ]);
  });

  it('keeps atomic nodes and leaves within the max layer unchanged', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(10, 10, 200, 40), [fakeNode(rect(10, 10, 50, 20))], {
        isAtomic: true,
      }),
      fakeNode(rect(10, 60, 100, 20)),
    ]);

    expect(collect(root, { maxLayer: 1 })).toEqual([
      rect(10, 10, 200, 40),
      rect(10, 60, 100, 20),
    ]);
  });

  it('turns a scrollable node below the max layer into one bone of its visible area', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 100, 300, 200), [fakeNode(rect(0, 100, 300, 0))], {
        isScrollable: true,
      }),
    ]);

    expect(collect(root, { maxLayer: 0 })).toEqual([rect(0, 100, 300, 200)]);
  });

  it('gives a zero-size node below the max layer a fallback bone', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(10, 10, 0, 0), [fakeNode(rect(10, 10, 50, 20))]),
    ]);

    expect(collect(root, { maxLayer: 0 })).toEqual([rect(10, 10, 120, 16)]);
  });

  it('collapses only the subtrees deeper than the max layer', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(10, 10, 100, 20)),
      fakeNode(rect(0, 40, 300, 200), [
        fakeNode(rect(0, 40, 300, 100), [fakeNode(rect(10, 50, 60, 20))]),
      ]),
    ]);

    expect(collect(root, { maxLayer: 1 })).toEqual([
      rect(10, 10, 100, 20),
      rect(0, 40, 300, 100),
    ]);
  });
  it('keeps the bones of the fixture tree unchanged without geometry options', () => {
    expect(collect(fixtureTree())).toMatchSnapshot();
  });
});

describe('collectBones with mergeGap', () => {
  it('merges an icon, a label and a chevron on one line into one bone', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(16, 16, 24, 24)),
      fakeNode(rect(48, 18, 200, 20)),
      fakeNode(rect(256, 20, 12, 16)),
    ]);

    expect(collect(root, { mergeGap: 8 })).toEqual([rect(16, 16, 252, 24)]);
  });

  it('keeps two lines as two bones', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(16, 16, 200, 20)),
      fakeNode(rect(16, 44, 200, 20)),
    ]);

    expect(collect(root, { mergeGap: 8 })).toEqual([
      rect(16, 16, 200, 20),
      rect(16, 44, 200, 20),
    ]);
  });

  it('keeps bones apart when their gap is larger than mergeGap', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(16, 16, 100, 20)),
      fakeNode(rect(132, 16, 100, 20)),
    ]);

    expect(collect(root, { mergeGap: 8 })).toEqual([
      rect(16, 16, 100, 20),
      rect(132, 16, 100, 20),
    ]);
  });

  it('chains merges through bones that were already merged', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(108, 0, 50, 20)),
      fakeNode(rect(0, 0, 50, 20)),
      fakeNode(rect(54, 0, 50, 20)),
    ]);

    expect(collect(root, { mergeGap: 4 })).toEqual([rect(0, 0, 158, 20)]);
  });

  it('returns the bones ordered by line and then by column', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(16, 60, 100, 20)),
      fakeNode(rect(200, 16, 80, 20)),
      fakeNode(rect(16, 16, 100, 20)),
    ]);

    expect(collect(root, { mergeGap: 8 })).toEqual([
      rect(16, 16, 100, 20),
      rect(200, 16, 80, 20),
      rect(16, 60, 100, 20),
    ]);
  });
});

describe('collectBones with collapseBelow', () => {
  it('turns a short node with tight children into one bone', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(16, 16, 120, 44), [
        fakeNode(rect(28, 26, 24, 24)),
        fakeNode(rect(56, 30, 68, 16)),
      ]),
    ]);

    expect(collect(root, { collapseBelow: 56 })).toEqual([
      rect(16, 16, 120, 44),
    ]);
  });

  it('turns a short node with stacked children into one bone', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(16, 16, 200, 44), [
        fakeNode(rect(16, 16, 60, 16)),
        fakeNode(rect(16, 36, 120, 24)),
      ]),
    ]);

    expect(collect(root, { collapseBelow: 56 })).toEqual([
      rect(16, 16, 200, 44),
    ]);
  });

  it('walks into a short row whose children are further apart than the default tight gap', () => {
    const root = fakeNode(rect(0, 0, 400, 600), [
      fakeNode(rect(16, 16, 328, 44), [
        fakeNode(rect(16, 16, 100, 44)),
        fakeNode(rect(128, 16, 100, 44)),
      ]),
    ]);

    expect(collect(root, { collapseBelow: 56 })).toEqual([
      rect(16, 16, 100, 44),
      rect(128, 16, 100, 44),
    ]);
  });

  it('walks into a node taller than collapseBelow', () => {
    const root = fakeNode(rect(0, 0, 400, 600), [
      fakeNode(rect(16, 16, 328, 200), [
        fakeNode(rect(32, 32, 100, 20)),
        fakeNode(rect(32, 60, 200, 20)),
      ]),
    ]);

    expect(collect(root, { collapseBelow: 56 })).toEqual([
      rect(32, 32, 100, 20),
      rect(32, 60, 200, 20),
    ]);
  });

  it('never collapses a scrollable node', () => {
    const content = fakeNode(rect(0, 100, 300, 400), [
      fakeNode(rect(10, 110, 100, 20)),
    ]);
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(rect(0, 100, 300, 40), [content], { isScrollable: true }),
    ]);

    expect(collect(root, { collapseBelow: 56 })).toEqual([
      rect(10, 110, 100, 20),
    ]);
  });
});

describe('collectBones with surfaceDepth', () => {
  function card(): FakeNode {
    return fakeNode(
      rect(16, 16, 328, 200),
      [
        fakeNode(rect(32, 32, 296, 40), [
          fakeNode(rect(32, 32, 40, 40)),
          fakeNode(rect(80, 32, 200, 40), [
            fakeNode(rect(80, 32, 120, 18)),
            fakeNode(rect(80, 54, 160, 18)),
          ]),
        ]),
        fakeNode(rect(32, 88, 296, 20)),
      ],
      { hasBorder: true }
    );
  }

  function wrapped(node: FakeNode, wrappers: number): FakeNode {
    return wrappers === 0
      ? node
      : wrapped(fakeNode(rect(0, 0, 360, 600), [node]), wrappers - 1);
  }

  const cardBones = [
    rect(32, 88, 296, 20),
    rect(32, 32, 40, 40),
    rect(80, 32, 200, 40),
  ];

  it('collapses the grandchildren of a surface whatever its depth', () => {
    const shallowRoot = fakeNode(rect(0, 0, 360, 600), [card()]);
    const deepRoot = fakeNode(rect(0, 0, 360, 600), [wrapped(card(), 2)]);

    expect(collect(shallowRoot, { surfaceDepth: 1 })).toEqual(cardBones);
    expect(collect(deepRoot, { surfaceDepth: 1 })).toEqual(cardBones);
  });

  it('restarts the surface layer count at a nested surface', () => {
    const root = fakeNode(rect(0, 0, 300, 600), [
      fakeNode(
        rect(0, 0, 300, 300),
        [
          fakeNode(
            rect(16, 16, 268, 200),
            [
              fakeNode(rect(32, 32, 236, 60), [
                fakeNode(rect(32, 32, 100, 20)),
                fakeNode(rect(32, 60, 100, 20)),
              ]),
            ],
            { hasBorder: true }
          ),
        ],
        { hasBorder: true }
      ),
    ]);

    expect(collect(root, { surfaceDepth: 1 })).toEqual([
      rect(32, 32, 100, 20),
      rect(32, 60, 100, 20),
    ]);
  });

  it('still applies maxLayer on top of surfaceDepth', () => {
    const root = fakeNode(rect(0, 0, 360, 600), [card()]);

    expect(collect(root, { surfaceDepth: 1, maxLayer: 1 })).toEqual([
      rect(32, 32, 296, 40),
      rect(32, 88, 296, 20),
    ]);
  });
});
