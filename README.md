# react-native-dynamic-skeleton-generation

Skeleton container that analyzes your rendered component at runtime and generates a matching skeleton for it.

## Installation


```sh
npm install react-native-dynamic-skeleton-generation react-native-reanimated react-native-worklets
```

`react-native-reanimated` (4 or newer) and `react-native-worklets` are peer dependencies. Follow the Reanimated installation guide to finish their setup.


## Usage


```tsx
import { SkeletonContainer } from 'react-native-dynamic-skeleton-generation';

<SkeletonContainer isLoading={isLoading} style={{ flex: 1 }}>
  <ProfileScreen user={user ?? placeholderUser} />
</SkeletonContainer>;
```

While `isLoading` is true the children stay mounted but hidden, and a bone is drawn over every rendered leaf (text, image, input, empty view). An empty list gets a single item-sized bone at its top.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isLoading` | `boolean` | required | Shows the skeleton instead of the children |
| `style` | `StyleProp<ViewStyle>` | | Style of the view that holds the children |
| `preset` | `SkeletonPresetName` | | Name of a preset registered on `SkeletonContainerProvider` |

`SkeletonContainer` also accepts every option below as a prop.

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `boneColor` | `string` | `'#E1E9EE'` | Background color of every bone |
| `boneBorderRadius` | `number` | `4` | Corner radius of every bone |
| `animation` | `'pulse' \| 'none'` | `'pulse'` | Bone animation |
| `fadeSwap` | `boolean` | `false` | Cross-fades from skeleton to content when loading ends |
| `maxLayer` | `number` | `Infinity` | Deepest layer the walker expands; every view below it collapses into a single bone |
| `mergeGap` | `number` | off | Merges bones on the same line whose horizontal gap is at most this many dp |
| `collapseBelow` | `number` | off | Draws a view at most this tall as one bone when its children sit tightly together |
| `surfaceDepth` | `number` | off | Deepest layer the walker expands inside a bordered view, counted from that view |

Layers count rendered host views: the direct children of `SkeletonContainer` are layer 1, their children layer 2, and so on. With `maxLayer={2}`, a `View` nested three levels deep becomes one bone covering its whole area. Lists use internal wrapper views, so a `FlatList` item sits a few layers below the list itself.

`maxLayer` depends on how many wrapper views sit above your content. The three geometry options decide from measured layout instead, so they keep working when the tree changes:

- `mergeGap`: two bones are on the same line when they overlap vertically by at least half of the smaller height. Bones on the same line merge into their bounding box when they overlap or their gap is at most `mergeGap`. Merging repeats until nothing changes, so an icon, a label and a chevron become one bar.
- `collapseBelow`: a view with children whose height is at most `collapseBelow` becomes one bone when no horizontal gap between its children is larger than `mergeGap` (or 8 when `mergeGap` is off). Buttons, badges, icon + label rows and label-over-value cells become blocks; a row of two buttons spaced 12 apart stays two bones. Scrollable views are never collapsed.
- `surfaceDepth`: a view that draws a border is a surface. Its children are surface layer 1, their children layer 2, and the count restarts at every nested surface. Views deeper than `surfaceDepth` inside a surface become one bone, however many wrappers sit above the surface. `maxLayer` still applies.

### Provider

Configure every container once at the root of your app:

```tsx
import { SkeletonContainerProvider } from 'react-native-dynamic-skeleton-generation';

const SKELETON_OPTIONS = { boneColor: '#E5E7EB', boneBorderRadius: 8, fadeSwap: true };
const SKELETON_PRESETS = {
  sections: { collapseBelow: 56, mergeGap: 8, surfaceDepth: 1 },
};

<SkeletonContainerProvider options={SKELETON_OPTIONS} presets={SKELETON_PRESETS}>
  <App />
</SkeletonContainerProvider>;
```

Then pick a preset where you need it:

```tsx
<SkeletonContainer isLoading={isLoading} preset="sections">
  <SubscriptionCard />
</SkeletonContainer>
```

Options resolve from weakest to strongest:

1. Library defaults
2. Provider `options`
3. Provider `presets[preset]`
4. The container's own props

An `undefined` value never overrides, so `maxLayer={undefined}` keeps the inherited value. Without a provider the library defaults apply. An unknown preset name logs a warning once in development and is ignored.

Define `options` and `presets` outside render, or memoise them. A new object on every render re-renders every container and measures the bones again.

To type preset names, augment `SkeletonPresets`:

```ts
declare module 'react-native-dynamic-skeleton-generation' {
  interface SkeletonPresets {
    sections: true;
  }
}
```

`preset` then accepts only `'sections'`. Without the augmentation it accepts any string.


## Known limitations

- Outside lists, a component that renders nothing without data produces no bones; empty leaves only get a generic fallback bone.
- A list with a header but no items shows header bones and no list bone.
- Bones are offset by the parent's border width when the parent has a border.
- Nested `Text` inside a `Text` without direct raw text may produce extra fallback bones on native.
- `surfaceDepth` only detects views that draw a border. A card with a filled background and no border is not a surface.
- `collapseBelow` is measured in dp, so a large system font scale can push a view over the threshold and leave it expanded.


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
