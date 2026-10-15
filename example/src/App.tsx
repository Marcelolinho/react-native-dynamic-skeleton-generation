import { useState } from 'react';
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonContainerProvider } from 'react-native-dynamic-skeleton-generation';
import type { SkeletonOptions } from 'react-native-dynamic-skeleton-generation';
import { MergeGapScreen } from './MergeGapScreen';
import { PresetScreen } from './PresetScreen';
import { ProfileScreen } from './ProfileScreen';
import { Toggle } from './Toggle';

declare module 'react-native-dynamic-skeleton-generation' {
  interface SkeletonPresets {
    sections: true;
  }
}

type Screen = 'profile' | 'presets' | 'mergeGap';

const SCREENS: Screen[] = ['profile', 'presets', 'mergeGap'];

const SCREEN_COMPONENTS: Record<Screen, ComponentType> = {
  profile: ProfileScreen,
  presets: PresetScreen,
  mergeGap: MergeGapScreen,
};

function nextScreen(screen: Screen): Screen {
  return SCREENS[(SCREENS.indexOf(screen) + 1) % SCREENS.length]!;
}

const SKELETON_OPTIONS: SkeletonOptions = {
  boneColor: '#E5E7EB',
  boneBorderRadius: 8,
  fadeSwap: true,
};

const SKELETON_PRESETS: Record<string, SkeletonOptions> = {
  sections: { collapseBelow: 56, mergeGap: 8, surfaceDepth: 1 },
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('profile');
  const ScreenComponent = SCREEN_COMPONENTS[screen];

  return (
    <SkeletonContainerProvider
      options={SKELETON_OPTIONS}
      presets={SKELETON_PRESETS}
    >
      <View style={styles.app}>
        <Toggle
          label={`screen: ${screen}`}
          onPress={() => setScreen(nextScreen(screen))}
        />
        <ScreenComponent />
      </View>
    </SkeletonContainerProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
    gap: 16,
  },
});
