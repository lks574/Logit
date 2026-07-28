import React from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

// 저장·삭제처럼 화면을 떠나면서 알려야 하는 결과용 짧은 안내.
// Alert는 react-native-web에서 no-op이고, ActionSheet는 확인 탭을 강요해 성공 피드백에는 과하다.
// 네비게이터 밖(App)에 두어 goBack으로 화면이 사라져도 메세지가 남는다.

type ToastValue = { show: (message: string) => void };

const ToastCtx = React.createContext<ToastValue | null>(null);

export function useToast(): ToastValue {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const VISIBLE_MS = 2200;
const useNative = Platform.OS !== 'web'; // RNW는 native driver 미지원

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = React.useState<string | null>(null);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = React.useCallback(
    (next: string) => {
      if (timer.current) clearTimeout(timer.current); // 연속 호출 시 마지막 메세지로 갱신
      setMessage(next);
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: useNative }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: useNative }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, VISIBLE_MS);
    },
    [opacity],
  );

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = React.useMemo(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {message ? <ToastView message={message} opacity={opacity} /> : null}
    </ToastCtx.Provider>
  );
}

function ToastView({ message, opacity }: { message: string; opacity: Animated.Value }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      pointerEvents="none" // 탭 바·버튼을 가리지 않는다
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 92, // 하단 탭 바 위
        alignItems: 'center',
        opacity,
      }}
    >
      <View
        style={{
          maxWidth: 420,
          backgroundColor: c.text,
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 18,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.bg, textAlign: 'center' }}>{message}</Text>
      </View>
    </Animated.View>
  );
}
