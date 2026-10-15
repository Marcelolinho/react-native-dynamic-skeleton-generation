import { describe, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { SkeletonContainerProvider } from '../SkeletonContainerProvider';
import { useSkeletonBones } from '../useSkeletonBones';
import { useSkeletonOptions } from '../useSkeletonOptions';
import type { Bone, HostNode, Rect, SkeletonOptions } from '../types';

type FakeHostNode = HostNode & { parentElement?: FakeHostNode };

function hostNode(bounds: Rect, children: FakeHostNode[] = []): FakeHostNode {
  return {
    tagName: 'RN:View',
    childNodes: [],
    children,
    getBoundingClientRect: () => bounds,
  };
}

const mockContainer: FakeHostNode = {
  ...hostNode({ x: 0, y: 0, width: 300, height: 600 }, [
    hostNode({ x: 16, y: 16, width: 200, height: 44 }, [
      hostNode({ x: 16, y: 26, width: 24, height: 24 }),
      hostNode({ x: 48, y: 28, width: 120, height: 20 }),
    ]),
  ]),
  parentElement: hostNode({ x: 0, y: 0, width: 300, height: 600 }),
};

jest.mock('react-native-reanimated', () => ({
  useAnimatedRef: () => ({ current: mockContainer }),
}));

describe('useSkeletonBones', () => {
  it('collects the bones again when the provider options change', () => {
    const renders: Bone[][] = [];

    function BonesProbe() {
      renders.push(useSkeletonBones(true, useSkeletonOptions({})).bones);
      return null;
    }

    const probe = <BonesProbe />;
    let renderer: ReactTestRenderer | undefined;

    function withProviderOptions(options: SkeletonOptions) {
      return (
        <SkeletonContainerProvider options={options}>
          {probe}
        </SkeletonContainerProvider>
      );
    }

    act(() => {
      renderer = create(withProviderOptions({}));
    });

    expect(renders.at(-1)).toEqual([
      { x: 16, y: 26, width: 24, height: 24 },
      { x: 48, y: 28, width: 120, height: 20 },
    ]);

    act(() => {
      renderer?.update(withProviderOptions({ collapseBelow: 56 }));
    });

    expect(renders.at(-1)).toEqual([{ x: 16, y: 16, width: 200, height: 44 }]);
  });
});
