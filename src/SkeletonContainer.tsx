import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeOut, css } from 'react-native-reanimated';
import { useSkeletonBones } from './useSkeletonBones';
import { useSkeletonOptions } from './useSkeletonOptions';
import type { Bone, PresetSelection, SkeletonOptions } from './types';

export type SkeletonContainerProps = {
  isLoading: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
} & PresetSelection &
  SkeletonOptions;

const FADE_DURATION_MS = 200;
const PULSE_DURATION_MS = 800;
const PULSE_MIN_OPACITY = 0.4;

export function SkeletonContainer({
  isLoading,
  children,
  style,
  ...optionProps
}: SkeletonContainerProps) {
  const { boneColor, boneBorderRadius, animation, fadeSwap, ...walkOptions } =
    useSkeletonOptions(optionProps);
  const { containerRef, bones, measureBones } = useSkeletonBones(
    isLoading,
    walkOptions
  );

  function renderBone(bone: Bone, index: number) {
    return (
      <View
        key={index}
        style={[
          styles.bone,
          {
            left: bone.x,
            top: bone.y,
            width: bone.width,
            height: bone.height,
            backgroundColor: boneColor,
            borderRadius: boneBorderRadius,
          },
        ]}
      />
    );
  }

  return (
    <>
      <Animated.View
        ref={containerRef}
        onLayout={measureBones}
        style={[
          style,
          isLoading ? styles.hiddenContent : styles.visibleContent,
          fadeSwap ? animatedStyles.fadedSwap : undefined,
        ]}
        pointerEvents={isLoading ? 'none' : 'auto'}
        accessibilityElementsHidden={isLoading}
        importantForAccessibility={isLoading ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </Animated.View>
      {isLoading && (
        <Animated.View
          style={styles.overlay}
          pointerEvents="none"
          exiting={fadeSwap ? FadeOut.duration(FADE_DURATION_MS) : undefined}
        >
          <Animated.View
            style={[
              styles.overlay,
              animation === 'pulse' ? animatedStyles.pulse : undefined,
            ]}
          >
            {bones.map(renderBone)}
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hiddenContent: {
    opacity: 0,
  },
  visibleContent: {
    opacity: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  bone: {
    position: 'absolute',
  },
});

const animatedStyles = css.create({
  fadedSwap: {
    transitionProperty: 'opacity',
    transitionDuration: FADE_DURATION_MS,
  },
  pulse: {
    animationName: {
      from: { opacity: 1 },
      to: { opacity: PULSE_MIN_OPACITY },
    },
    animationDuration: PULSE_DURATION_MS,
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
  },
});
