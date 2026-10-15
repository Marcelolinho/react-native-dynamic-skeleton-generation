import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { DEFAULT_SKELETON_OPTIONS } from '../constants';
import { SkeletonContainerProvider } from '../SkeletonContainerProvider';
import type { SkeletonContainerProviderProps } from '../SkeletonContainerProvider';
import { useSkeletonOptions } from '../useSkeletonOptions';
import type {
  PresetSelection,
  ResolvedSkeletonOptions,
  SkeletonOptions,
  SkeletonPresetName,
} from '../types';

type ProviderConfig = Omit<SkeletonContainerProviderProps, 'children'>;

function resolveOptions(
  containerOptions: SkeletonOptions & PresetSelection,
  provider?: ProviderConfig
): ResolvedSkeletonOptions {
  const resolved: ResolvedSkeletonOptions[] = [];

  function OptionsProbe() {
    resolved.push(useSkeletonOptions(containerOptions));
    return null;
  }

  act(() => {
    create(
      provider ? (
        <SkeletonContainerProvider {...provider}>
          <OptionsProbe />
        </SkeletonContainerProvider>
      ) : (
        <OptionsProbe />
      )
    );
  });

  const latest = resolved.at(-1);

  if (!latest) {
    throw new Error('OptionsProbe did not render');
  }

  return latest;
}

const sectionsProvider: ProviderConfig = {
  options: { boneColor: '#E5E7EB', mergeGap: 4, maxLayer: 5 },
  presets: { sections: { collapseBelow: 56, mergeGap: 8, surfaceDepth: 1 } },
};

describe('useSkeletonOptions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('falls back to the library defaults without a provider', () => {
    expect(resolveOptions({})).toEqual(DEFAULT_SKELETON_OPTIONS);
  });

  it('applies the provider options over the library defaults', () => {
    expect(resolveOptions({}, sectionsProvider)).toEqual({
      ...DEFAULT_SKELETON_OPTIONS,
      boneColor: '#E5E7EB',
      mergeGap: 4,
      maxLayer: 5,
    });
  });

  it('applies the preset over the provider options', () => {
    expect(resolveOptions({ preset: 'sections' }, sectionsProvider)).toEqual({
      ...DEFAULT_SKELETON_OPTIONS,
      boneColor: '#E5E7EB',
      maxLayer: 5,
      mergeGap: 8,
      collapseBelow: 56,
      surfaceDepth: 1,
    });
  });

  it('applies the container props over the preset', () => {
    const resolved = resolveOptions(
      { preset: 'sections', mergeGap: 2, boneColor: '#000000' },
      sectionsProvider
    );

    expect(resolved.mergeGap).toBe(2);
    expect(resolved.boneColor).toBe('#000000');
    expect(resolved.collapseBelow).toBe(56);
  });

  it('keeps the inherited value when a container prop is undefined', () => {
    const resolved = resolveOptions(
      { preset: 'sections', maxLayer: undefined, mergeGap: undefined },
      sectionsProvider
    );

    expect(resolved.maxLayer).toBe(5);
    expect(resolved.mergeGap).toBe(8);
  });

  it('warns once about an unknown preset and ignores it', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const missingPreset: string = 'missing';
    const unknownPreset = { preset: missingPreset as SkeletonPresetName };

    const resolved = resolveOptions(unknownPreset, sectionsProvider);
    resolveOptions(unknownPreset, sectionsProvider);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(resolved).toEqual(resolveOptions({}, sectionsProvider));
  });
});
