# Changelog

## 0.3.0 (2026-10-15)

### Features

- `SkeletonContainerProvider` sets shared `options` and named `presets` for every `SkeletonContainer` below it.
- `preset` prop on `SkeletonContainer` applies a preset registered on the provider. Preset names can be typed by augmenting `SkeletonPresets`.
- `mergeGap` option merges bones on the same line whose horizontal gap is at most `mergeGap`.
- `collapseBelow` option draws a short view with tightly packed children as one bone.
- `surfaceDepth` option limits how deep the walker expands inside a bordered view, counted from that view.
- `SkeletonOptions`, `SkeletonPresets` and `SkeletonPresetName` types are exported.

All new options are off by default, so existing skeletons are unchanged.
