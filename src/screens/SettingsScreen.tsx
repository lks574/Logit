import React from 'react';
import { View } from 'react-native';
import { Screen, T, Divider } from '../components/primitives';
import { Glyph, Path, Circle, Icon } from '../components/Glyph';
import { Segmented } from '../components/controls';
import { SettingsRow } from '../components/Field';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';

// 4.8 설정 — profile card, grouped surface cards with rows + dividers.
export default function SettingsScreen() {
  const { c, scheme, toggle } = useTheme();
  const [lang, setLang] = React.useState<'ko' | 'en'>('ko');

  // Theme selector: Light / Dark / 시스템. Wired to useTheme().
  // scheme === 'dark' -> 'dark', otherwise 'light' (시스템 is local-only UX).
  const themeMode: 'light' | 'dark' | 'system' = scheme === 'dark' ? 'dark' : 'light';
  const onThemeChange = (v: 'light' | 'dark' | 'system') => {
    const wantDark = v === 'dark';
    if (wantDark !== (scheme === 'dark')) toggle();
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: radius.card,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );

  const SectionLabel = ({ text }: { text: string }) => (
    <T style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginHorizontal: 4, marginBottom: 7 }}>
      {text}
    </T>
  );

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Title */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 }}>
        <T style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>설정</T>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {/* Profile card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 13,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: radius.card,
            padding: 14,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>현</T>
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 15, fontWeight: '600', color: c.text }}>현우</T>
            <T style={{ fontSize: 12, color: c.text2, marginTop: 1 }}>hyunwoo@flitto.com</T>
          </View>
          <Icon.chevronRight size={18} color={c.text3} strokeWidth={2} />
        </View>

        {/* 백업 · 동기화 */}
        <View>
          <SectionLabel text="백업 · 동기화" />
          <Card>
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M18 10a4 4 0 0 0-.7-7.9A6 6 0 0 0 6 6.5 4.5 4.5 0 0 0 7 15h11a3.5 3.5 0 0 0 0-5z" />
                </Glyph>
              }
              label="클라우드 백업"
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.success }} />
                  <T style={{ fontSize: 12, color: c.success }}>최신</T>
                </View>
              }
            />
            <Divider />
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
                </Glyph>
              }
              label="데이터 내보내기"
              value="CSV · JSON"
              right={<View style={{ width: 0 }} />}
            />
          </Card>
        </View>

        {/* 건강 데이터 연동 */}
        <View>
          <SectionLabel text="건강 데이터 연동" />
          <Card>
            <SettingsRow
              icon={
                <Glyph size={18} color={c.error} strokeWidth={1.8}>
                  <Path d="M20.8 5.6a5.5 5.5 0 0 0-8.8 1 5.5 5.5 0 0 0-8.8-1c-2.2 2.2-2 5.6.4 8L12 21l8.4-7.4c2.4-2.4 2.6-5.8.4-8z" />
                </Glyph>
              }
              label="Apple 건강 / Health Connect"
              right={
                <View
                  style={{
                    backgroundColor: c.surfaceAlt,
                    borderRadius: 6,
                    paddingVertical: 4,
                    paddingHorizontal: 9,
                  }}
                >
                  <T style={{ fontSize: 11, fontWeight: '600', color: c.text2 }}>곧 지원</T>
                </View>
              }
            />
          </Card>
          <T style={{ fontSize: 11, color: c.text3, marginHorizontal: 4, marginTop: 7 }}>
            자동 거리·심박 동기화는 후속 업데이트에서 제공됩니다.
          </T>
        </View>

        {/* 앱 */}
        <View>
          <SectionLabel text="앱" />
          <Card>
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M12 3a6 6 0 0 0 0 18 9 9 0 0 1 0-18z" />
                </Glyph>
              }
              label="테마"
              right={
                <Segmented
                  options={[
                    { key: 'light', label: 'Light' },
                    { key: 'dark', label: 'Dark' },
                    { key: 'system', label: '시스템' },
                  ]}
                  value={themeMode}
                  onChange={onThemeChange}
                />
              }
            />
            <Divider />
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Circle cx="12" cy="12" r="9" />
                  <Path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
                </Glyph>
              }
              label="언어"
              right={
                <Segmented
                  options={[
                    { key: 'ko', label: '한국어' },
                    { key: 'en', label: 'English' },
                  ]}
                  value={lang}
                  onChange={setLang}
                />
              }
            />
          </Card>
        </View>
      </View>
    </Screen>
  );
}
