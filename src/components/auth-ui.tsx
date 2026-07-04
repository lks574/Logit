import React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { Glyph, Path, Rect, Circle } from './Glyph';
import { useTheme } from '../theme/ThemeContext';

// ---- 인증 화면 전용 아이콘 (핸드오프 SVG 그대로) ----
type IP = { size?: number; color: string; strokeWidth?: number };
export const AuthIcon = {
  mail: (p: IP) => (
    <Glyph size={p.size} color={p.color} strokeWidth={p.strokeWidth ?? 2}>
      <Rect x="3" y="5" width="18" height="14" rx="2.5" />
      <Path d="M4 7l8 6 8-6" />
    </Glyph>
  ),
  lock: (p: IP) => (
    <Glyph size={p.size} color={p.color} strokeWidth={p.strokeWidth ?? 2}>
      <Rect x="4" y="10" width="16" height="10" rx="2.5" />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Glyph>
  ),
  user: (p: IP) => (
    <Glyph size={p.size} color={p.color} strokeWidth={p.strokeWidth ?? 2}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M5 21v-1a6 6 0 0 1 14 0v1" />
    </Glyph>
  ),
  eye: (p: IP) => (
    <Glyph size={p.size} color={p.color} strokeWidth={p.strokeWidth ?? 2}>
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <Circle cx="12" cy="12" r="3" />
    </Glyph>
  ),
  eyeOff: (p: IP) => (
    <Glyph size={p.size} color={p.color} strokeWidth={p.strokeWidth ?? 2}>
      <Path d="M2 12s3.5-7 10-7c2 0 3.8.6 5.3 1.5M22 12s-3.5 7-10 7c-2 0-3.8-.6-5.3-1.5" />
      <Path d="M9.5 9.5a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </Glyph>
  ),
  info: (p: IP) => (
    <Glyph size={p.size} color={p.color} strokeWidth={p.strokeWidth ?? 2}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8h.01M11 12h1v4h1" />
    </Glyph>
  ),
};

// ---- 라벨 + 아이콘 좌측 입력 (포커스 링 · 비번 눈 토글 · 에러) ----
export function AuthInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  autoCapitalize = 'none',
  autoFocus,
  error,
  onSubmitEditing,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoFocus?: boolean;
  error?: string;
  onSubmitEditing?: () => void;
}) {
  const { c } = useTheme();
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(true);
  const ref = React.useRef<TextInput>(null);
  const borderColor = error ? c.error : focused ? c.accent : c.border;

  return (
    <View style={{ gap: 7 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{label}</Text>
      <Pressable
        onPress={() => ref.current?.focus()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          backgroundColor: c.surface,
          borderWidth: focused && !error ? 1.5 : 1,
          borderColor,
          borderRadius: 12,
          paddingHorizontal: 13,
          paddingVertical: 12,
        }}
      >
        {icon}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.text3}
          secureTextEntry={secure && hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          style={{ flex: 1, fontSize: 14, color: c.text, padding: 0 }}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            {hidden ? <AuthIcon.eyeOff size={18} color={c.text3} /> : <AuthIcon.eye size={18} color={c.text3} />}
          </Pressable>
        ) : null}
      </Pressable>
      {error ? <Text style={{ fontSize: 12, color: c.error }}>{error}</Text> : null}
    </View>
  );
}

// ---- Primary CTA (accent, 로딩/비활성) ----
export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}) {
  const { c } = useTheme();
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={{
        width: '100%',
        height: 52, // 고정 — 라벨 스크립트(라틴/한글)에 따라 라인박스 높이가 달라지는 것 방지
        backgroundColor: c.accent,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: off ? 0.5 : 1,
        ...style,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{label}</Text>
      )}
    </Pressable>
  );
}

// ---- 소셜 버튼 (Google / Apple) ----
export function SocialButton({
  provider,
  label,
  onPress,
  flex,
}: {
  provider: 'google' | 'apple';
  label: string;
  onPress: () => void;
  flex?: boolean;
}) {
  const { c } = useTheme();
  const base = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 9,
    borderRadius: 14,
    paddingVertical: 13,
    ...(flex ? { flex: 1 } : { width: '100%' as const }),
  };
  if (provider === 'google') {
    return (
      <Pressable onPress={onPress} style={{ ...base, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: c.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#4285F4' }}>G</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={{ ...base, backgroundColor: '#000' }}>
      <Svg width={15} height={15} viewBox="0 0 24 24" fill="#fff">
        <SvgPath d="M16.4 12.9c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.1-2.9.9-3.6.9s-1.9-.9-3.1-.8c-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.7zM14.3 5.9c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.8-1.3z" />
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{label}</Text>
    </Pressable>
  );
}

// ---- "또는" 구분선 ----
export function OrDivider() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
      <Text style={{ fontSize: 12, color: c.text3 }}>또는</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
    </View>
  );
}

// ---- 뒤로가기 (34px 원형) ----
export function BackButton({ onPress }: { onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: c.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Glyph size={17} color={c.text2} strokeWidth={2.4}>
        <Path d="M15 18l-6-6 6-6" />
      </Glyph>
    </Pressable>
  );
}

// ---- 하단 링크 문구 ("... 로그인") ----
export function FooterLink({
  text,
  linkText,
  onPress,
  small,
}: {
  text: string;
  linkText: string;
  onPress: () => void;
  small?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={6} style={{ alignItems: 'center', paddingVertical: 4 }}>
      <Text style={{ fontSize: small ? 12.5 : 13, color: c.text2 }}>
        {text} <Text style={{ color: c.accent, fontWeight: '600' }}>{linkText}</Text>
      </Text>
    </Pressable>
  );
}
