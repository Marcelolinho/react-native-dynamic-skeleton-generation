import type { ResolvedSkeletonOptions } from './types';

export const LIST_ITEM_HEIGHT = 48;
export const FALLBACK_BONE_WIDTH = 120;
export const FALLBACK_BONE_HEIGHT = 16;
export const NATIVE_SCROLL_TAG_FRAGMENT = 'ScrollView';
export const NATIVE_TEXT_TAG = 'RN:Paragraph';
export const TEXT_NODE_TYPE = 3;
export const SCROLLING_OVERFLOWS = ['auto', 'scroll'];
export const DEFAULT_TIGHT_GAP = 8;
export const DEFAULT_SKELETON_OPTIONS: ResolvedSkeletonOptions = {
  boneColor: '#E1E9EE',
  boneBorderRadius: 4,
  animation: 'pulse',
  fadeSwap: false,
  maxLayer: Infinity,
};
