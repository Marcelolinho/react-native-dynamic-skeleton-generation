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
| `boneColor` | `string` | `'#E1E9EE'` | Background color of every bone |
| `boneBorderRadius` | `number` | `4` | Corner radius of every bone |
| `animation` | `'pulse' \| 'none'` | `'pulse'` | Bone animation |
| `fadeSwap` | `boolean` | `false` | Cross-fades from skeleton to content when loading ends |
| `maxLayer` | `number` | `Infinity` | Deepest layer the walker expands; every view below it collapses into a single bone |

Layers count rendered host views: the direct children of `SkeletonContainer` are layer 1, their children layer 2, and so on. With `maxLayer={2}`, a `View` nested three levels deep becomes one bone covering its whole area. Lists use internal wrapper views, so a `FlatList` item sits a few layers below the list itself.


## Known limitations

- Outside lists, a component that renders nothing without data produces no bones; empty leaves only get a generic fallback bone.
- A list with a header but no items shows header bones and no list bone.
- Bones are offset by the parent's border width when the parent has a border.
- Nested `Text` inside a `Text` without direct raw text may produce extra fallback bones on native.


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
