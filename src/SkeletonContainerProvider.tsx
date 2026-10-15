import { createContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { SkeletonOptions } from './types';

export type SkeletonContainerProviderProps = {
  options?: SkeletonOptions;
  presets?: Record<string, SkeletonOptions>;
  children: ReactNode;
};

type SkeletonOptionsContextValue = {
  options: SkeletonOptions;
  presets: Record<string, SkeletonOptions>;
};

export const SkeletonOptionsContext =
  createContext<SkeletonOptionsContextValue>({ options: {}, presets: {} });

export function SkeletonContainerProvider({
  options,
  presets,
  children,
}: SkeletonContainerProviderProps) {
  const value = useMemo(
    () => ({ options: options ?? {}, presets: presets ?? {} }),
    [options, presets]
  );

  return (
    <SkeletonOptionsContext.Provider value={value}>
      {children}
    </SkeletonOptionsContext.Provider>
  );
}
