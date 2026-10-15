import { useContext } from 'react';
import { DEFAULT_SKELETON_OPTIONS } from './constants';
import { SkeletonOptionsContext } from './SkeletonContainerProvider';
import type {
  PresetSelection,
  ResolvedSkeletonOptions,
  SkeletonOptions,
  SkeletonPresetName,
} from './types';

const warnedPresetNames = new Set<string>();

function withoutUndefined(options: SkeletonOptions): SkeletonOptions {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined)
  );
}

function warnUnknownPresetOnce(preset: string) {
  if (__DEV__ && !warnedPresetNames.has(preset)) {
    warnedPresetNames.add(preset);
    console.warn(
      `react-native-dynamic-skeleton-generation: unknown preset "${preset}", ignoring it.`
    );
  }
}

function presetOptions(
  presets: Record<string, SkeletonOptions>,
  preset: SkeletonPresetName | undefined
): SkeletonOptions {
  if (preset === undefined) {
    return {};
  }

  const options = presets[preset];

  if (!options) {
    warnUnknownPresetOnce(preset);
  }

  return options ?? {};
}

export function useSkeletonOptions({
  preset,
  ...containerOptions
}: SkeletonOptions & PresetSelection): ResolvedSkeletonOptions {
  const { options, presets } = useContext(SkeletonOptionsContext);

  return {
    ...DEFAULT_SKELETON_OPTIONS,
    ...withoutUndefined(options),
    ...withoutUndefined(presetOptions(presets, preset)),
    ...withoutUndefined(containerOptions),
  };
}
