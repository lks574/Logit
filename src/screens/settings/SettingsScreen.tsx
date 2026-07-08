import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Screen, T, Divider } from '../../components/primitives';
import { Glyph, Path, Icon } from '../../components/Glyph';
import { Segmented } from '../../components/controls';
import { SettingsRow } from '../../components/Field';
import { LegalModal } from '../../components/LegalModal';
import { useTheme } from '../../theme/ThemeContext';
import { useLang, tr } from '../../i18n/i18n';
import { radius } from '../../theme/tokens';

// 설정 — 앱 환경설정 + 지원/정보. 마이 화면 우상단 기어에서 push. (내 데이터·계정은 마이 화면)
export default function SettingsScreen() {
  const { c, mode, setMode } = useTheme();
  const { mode: langMode, setMode: setLangMode } = useLang();
  const nav = useNavigation<any>();
  const [legal, setLegal] = React.useState(false);
  const version = Constants.expoConfig?.version ?? '?';

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.card, overflow: 'hidden' }}>
      {children}
    </View>
  );

  const SectionLabel = ({ text }: { text: string }) => (
    <T style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginHorizontal: 4, marginBottom: 7 }}>{text}</T>
  );

  // 라벨(아이콘) 위 · 컨트롤 전체 폭 아래로 스택 (다국어 가변 라벨에도 안전).
  const ControlRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <View style={{ padding: 14, gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon}
        <T style={{ fontSize: 14, color: c.text }}>{label}</T>
      </View>
      {children}
    </View>
  );

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header: 뒤로 / 설정 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12 }}>
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr({ en: 'Back', ko: '뒤로' })}
          style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon.chevronLeft size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
        <T style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{tr({ en: 'Settings', ko: '설정' })}</T>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {/* 앱 환경 */}
        <View>
          <SectionLabel text={tr({ en: 'App', ko: '앱' })} />
          <Card>
            <ControlRow
              icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M12 3a6 6 0 0 0 0 18 9 9 0 0 1 0-18z" /></Glyph>}
              label={tr({ en: 'Theme', ko: '테마' })}
            >
              <Segmented
                options={[
                  { key: 'light', label: 'Light' },
                  { key: 'dark', label: 'Dark' },
                  { key: 'system', label: tr({ en: 'System', ko: '시스템' }) },
                ]}
                value={mode}
                onChange={setMode}
              />
            </ControlRow>
            <Divider />
            <ControlRow
              icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M5 8h14M9 4c-1.5 4-1.5 12 0 16M12 4v16" /><Path d="M4 20c3-1 5-3 6-6M14 14c1.5 2 3.5 4 6 6" /></Glyph>}
              label={tr({ en: 'Language', ko: '언어' })}
            >
              <Segmented
                options={[
                  { key: 'en', label: 'English' },
                  { key: 'ko', label: '한국어' },
                  { key: 'system', label: tr({ en: 'System', ko: '시스템' }) },
                ]}
                value={langMode}
                onChange={setLangMode}
              />
            </ControlRow>
          </Card>
        </View>

        {/* 정보 */}
        <View>
          <SectionLabel text={tr({ en: 'About', ko: '정보' })} />
          <Card>
            <SettingsRow
              icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M9 12h6M9 16h6M9 8h3M6 3h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /></Glyph>}
              label={tr({ en: 'Terms & Privacy', ko: '약관 및 개인정보' })}
              onPress={() => setLegal(true)}
            />
            <Divider />
            <SettingsRow
              icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 16v-4M12 8h.01" /></Glyph>}
              label={tr({ en: 'Version', ko: '버전' })}
              right={<T style={{ fontSize: 13, color: c.text3 }}>{version}</T>}
            />
          </Card>
        </View>
      </View>

      <LegalModal visible={legal} onClose={() => setLegal(false)} />
    </Screen>
  );
}
