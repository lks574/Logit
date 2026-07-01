import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, Palette } from './tokens';

type Scheme = 'light' | 'dark';
type ThemeValue = { c: Palette; scheme: Scheme; toggle: () => void };

const ThemeCtx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<Scheme | null>(null);
  const scheme: Scheme = override ?? (system === 'dark' ? 'dark' : 'light');

  const value = useMemo<ThemeValue>(
    () => ({
      c: scheme === 'dark' ? dark : light,
      scheme,
      toggle: () => setOverride(scheme === 'dark' ? 'light' : 'dark'),
    }),
    [scheme]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error('useTheme must be used within ThemeProvider');
  return v;
}
