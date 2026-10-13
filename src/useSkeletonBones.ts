import { useLayoutEffect, useState } from 'react';
import type { HostInstance } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { areBonesEqual, collectHostBones } from './utils';
import type { Bone } from './types';

export function useSkeletonBones(isLoading: boolean) {
  const containerRef = useAnimatedRef<HostInstance>();
  const [bones, setBones] = useState<Bone[]>([]);

  function measureBones() {
    const container = containerRef.current;
    const parent = container?.parentElement;

    if (!isLoading || !container || !parent) {
      return;
    }

    const measuredBones = collectHostBones(
      container,
      parent.getBoundingClientRect()
    );

    setBones((currentBones) =>
      areBonesEqual(currentBones, measuredBones) ? currentBones : measuredBones
    );
  }

  useLayoutEffect(measureBones);

  return { containerRef, bones, measureBones };
}
