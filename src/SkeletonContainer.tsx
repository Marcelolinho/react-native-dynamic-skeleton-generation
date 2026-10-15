import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeOut, css } from 'react-native-reanimated';
import { useSkeletonBones } from './useSkeletonBones';
import type { Bone } from './types';

export type SkeletonAnimation = 'pulse' | 'none';

export type SkeletonContainerProps = {
  isLoading: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  boneColor?: string;
  boneBorderRadius?: number;
  animation?: SkeletonAnimation;
  fadeSwap?: boolean;
  maxLayer?: number;
};

const FADE_DURATION_MS = 200;
const PULSE_DURATION_MS = 800;
const PULSE_MIN_OPACITY = 0.4;
const DEFAULT_BONE_COLOR = '#E1E9EE';
const DEFAULT_BONE_BORDER_RADIUS = 4;
const DEFAULT_MAX_LAYER = Infinity;

export function SkeletonContainer({
  isLoading,
  children,
  style,
  boneColor = DEFAULT_BONE_COLOR,
  boneBorderRadius = DEFAULT_BONE_BORDER_RADIUS,
  animation = 'pulse',
  fadeSwap = false,
  maxLayer = DEFAULT_MAX_LAYER,
}: SkeletonContainerProps) {
  const { containerRef, bones, measureBones } = useSkeletonBones(
    isLoading,
    maxLayer
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
