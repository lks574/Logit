import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODE_KEY = '@logit/lang-mode';

export type Lang = 'en' | 'ko';
export type LangMode = Lang | 'system';
// 모든 UI 문자열은 이 형태로 인라인 작성 → 사용처에 번역이 붙어 누락/고아 키가 없다.
export type Msg = { en: string; ko: string };

// 시스템 언어 → 지원 언어. 한국어면 ko, 그 외(지원 안 함)는 전부 en (요구사항).
// Hermes 내장 Intl로 OS 로케일을 읽는다 — 네이티브 모듈/재빌드 불필요.
function systemLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // "ko-KR" | "en-US" ...
    return locale.toLowerCase().startsWith('ko') ? 'ko' : 'en';
  } catch {
    return 'en';
  }
}

// 컴포넌트 밖(selectors·lib 등)에서도 번역하려고 현재 언어를 모듈에 보관.
// Provider가 렌더 중 갱신하므로 tr() 호출 시점엔 항상 최신.
let current: Lang = systemLang();

export function tr(m: Msg): string {
  return m[current];
}

type Value = { lang: Lang; mode: LangMode; setMode: (m: LangMode) => void };
const Ctx = createContext<Value | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LangMode>('system');
  const lang: Lang = mode === 'system' ? systemLang() : mode;
  current = lang; // 렌더 중 동기화 → tr()가 항상 최신 언어를 읽음

  // 저장된 모드 복원(오프라인 우선 앱 — 재시작 후에도 유지).
  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((v) => {
        if (v === 'en' || v === 'ko' || v === 'system') setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((m: LangMode) => {
    setModeState(m);
    AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
  }, []);

  const value = useMemo<Value>(() => ({ lang, mode, setMode }), [lang, mode, setMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang must be used within LanguageProvider');
  return v;
}
