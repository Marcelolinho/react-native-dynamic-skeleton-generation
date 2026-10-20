import { useCallback, useLayoutEffect, useState } from 'react';
import type { HostInstance } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { areBonesEqual, collectHostBones } from './utils';
import type { Bone, WalkOptions } from './types';

export function useSkeletonBones(
  isLoading: boolean,
  { maxLayer, mergeGap, collapseBelow, surfaceDepth }: WalkOptions,
  content: unknown
) {
  const containerRef = useAnimatedRef<HostInstance>();
  const [bones, setBones] = useState<Bone[]>([]);

  const measureBones = useCallback(() => {
    const container = containerRef.current;
    const parent = container?.parentElement;

    if (!isLoading || !container || !parent) {
      return;
    }

    const measuredBones = collectHostBones(
      container,
      parent.getBoundingClientRect(),
      { maxLayer, mergeGap, collapseBelow, surfaceDepth }
    );

    setBones((currentBones) =>
      areBonesEqual(currentBones, measuredBones) ? currentBones : measuredBones
    );
  }, [
    isLoading,
    containerRef,
    maxLayer,
    mergeGap,
    collapseBelow,
    surfaceDepth,
  ]);

  useLayoutEffect(measureBones, [measureBones, content]);

  return { containerRef, bones, measureBones };
}
