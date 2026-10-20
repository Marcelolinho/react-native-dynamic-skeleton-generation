import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
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

const mockContainerRef = { current: mockContainer };

jest.mock('react-native-reanimated', () => ({
  useAnimatedRef: () => mockContainerRef,
}));

describe('useSkeletonBones', () => {
  it('collects the bones again when the provider options change', () => {
    const renders: Bone[][] = [];

    function BonesProbe() {
      renders.push(useSkeletonBones(true, useSkeletonOptions({}), null).bones);
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

describe('useSkeletonBones measuring', () => {
  const walkOptions = { maxLayer: Infinity };
  const firstContent = <></>;
  const secondContent = <></>;

  type ProbeProps = {
    isLoading: boolean;
    content: unknown;
    renderCount: number;
  };

  function MeasureProbe({ isLoading, content }: ProbeProps) {
    useSkeletonBones(isLoading, walkOptions, content);
    return null;
  }

  function renderProbe(props: ProbeProps) {
    let renderer: ReactTestRenderer | undefined;

    act(() => {
      renderer = create(<MeasureProbe {...props} />);
    });

    return (next: ProbeProps) =>
      act(() => {
        renderer?.update(<MeasureProbe {...next} />);
      });
  }

  let walks: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    walks = jest.spyOn(mockContainer, 'getBoundingClientRect');
  });

  afterEach(() => {
    walks.mockRestore();
  });

  it('walks the tree once while re-rendering with the same content', () => {
    const rerender = renderProbe({
      isLoading: true,
      content: firstContent,
      renderCount: 0,
    });

    rerender({ isLoading: true, content: firstContent, renderCount: 1 });
    rerender({ isLoading: true, content: firstContent, renderCount: 2 });

    expect(walks).toHaveBeenCalledTimes(1);
  });

  it('walks the tree again when the content changes', () => {
    const rerender = renderProbe({
      isLoading: true,
      content: firstContent,
      renderCount: 0,
    });

    rerender({ isLoading: true, content: secondContent, renderCount: 1 });

    expect(walks).toHaveBeenCalledTimes(2);
  });

  it('walks the tree only once loading starts', () => {
    const rerender = renderProbe({
      isLoading: false,
      content: firstContent,
      renderCount: 0,
    });

    expect(walks).not.toHaveBeenCalled();

    rerender({ isLoading: true, content: firstContent, renderCount: 1 });

    expect(walks).toHaveBeenCalledTimes(1);
  });
});
