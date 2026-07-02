import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dark, light, Palette } from './tokens';

const MODE_KEY = '@logit/theme-mode';

type Scheme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';
type ThemeValue = {
  c: Palette;
  scheme: Scheme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeCtx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  // 저장된 모드 복원(오프라인 우선 앱 — 재시작 후에도 유지).
  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({
      c: scheme === 'dark' ? dark : light,
      scheme,
      mode,
      setMode,
      toggle: () => setMode(scheme === 'dark' ? 'light' : 'dark'),
    }),
    [scheme, mode, setMode]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error('useTheme must be used within ThemeProvider');
  return v;
}
