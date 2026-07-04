import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, T, Divider } from '../../components/primitives';
import { Glyph, Path, Circle, Icon } from '../../components/Glyph';
import { Segmented } from '../../components/controls';
import { SettingsRow } from '../../components/Field';
import { ActionSheet } from '../../components/ActionSheet';
import { useStore } from '../../store/StoreContext';
import { useAuth } from '../../auth/AuthContext';
import { exportData, importData } from '../../lib/dataTransfer';
import type { StoreState } from '../../store/types';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../theme/tokens';

type SheetState =
  | { kind: 'none' }
  | { kind: 'export' }
  | { kind: 'confirmImport'; incoming: StoreState; summary: string }
  | { kind: 'confirmReset' }
  | { kind: 'confirmLogout' }
  | { kind: 'message'; title: string; message?: string };

// 4.8 설정 — profile card, grouped surface cards with rows + dividers.
export default function SettingsScreen() {
  const { c, mode, setMode } = useTheme();
  const nav = useNavigation<any>();
  const { profile, records, plans, customActivities, onboardingComplete, preferredActivities, replaceAll } =
    useStore();
  const { user, logout } = useAuth();
  const initial = (profile.name.trim()[0] ?? '?').toUpperCase();
  const [sheet, setSheet] = React.useState<SheetState>({ kind: 'none' });

  const errMessage = (e: unknown) =>
    e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';

  const runExport = async (format: 'json' | 'csv') => {
    // 시트를 먼저 none으로 닫지 않는다 — 단일 Modal이 dismiss→재present되는 race를 피하고,
    // 결과 message로 콘텐츠만 교체한다.
    try {
      const msg = await exportData(
        { records, plans, customActivities, profile, onboardingComplete, preferredActivities },
        format,
      );
      setSheet({ kind: 'message', title: '내보내기', message: msg });
    } catch (e) {
      setSheet({ kind: 'message', title: '내보내기 실패', message: errMessage(e) });
    }
  };

  const runImport = async () => {
    try {
      const incoming = await importData();
      if (!incoming) return; // 사용자 취소
      const summary = `기록 ${incoming.records.length}개 · 약속 ${incoming.plans.length}개를 가져옵니다. 현재 데이터는 모두 대체됩니다.`;
      setSheet({ kind: 'confirmImport', incoming, summary });
    } catch (e) {
      setSheet({ kind: 'message', title: '가져오기 실패', message: errMessage(e) });
    }
  };

  const confirmImport = async (incoming: StoreState) => {
    try {
      await replaceAll(incoming);
      setSheet({ kind: 'message', title: '가져오기 완료', message: '데이터를 복원했습니다.' });
    } catch (e) {
      setSheet({ kind: 'message', title: '가져오기 실패', message: '저장에 실패했습니다. 저장 공간을 확인해 주세요.' });
    }
  };

  // 데이터 리셋: 기록·약속·활동을 전부 비운다(프로필은 유지). replaceAll이 사진 고아까지 정리.
  const confirmReset = async () => {
    try {
      await replaceAll({
        records: [],
        plans: [],
        customActivities: [],
        profile,
        onboardingComplete: true, // 리셋해도 온보딩을 다시 띄우지 않음
        preferredActivities: [],
      });
      setSheet({ kind: 'message', title: '초기화 완료', message: '모든 기록과 약속을 삭제했습니다.' });
    } catch (e) {
      setSheet({ kind: 'message', title: '초기화 실패', message: '삭제에 실패했습니다. 다시 시도해 주세요.' });
    }
  };

  // 단일 ActionSheet에 넘길 콘텐츠(현재 sheet 종류에서 파생).
  const sheetView: {
    title: string;
    message?: string;
    actions: { label: string; onPress: () => void; destructive?: boolean }[];
    cancelLabel: string;
  } = (() => {
    switch (sheet.kind) {
      case 'export':
        return {
          title: '데이터 내보내기',
          message: '형식을 선택하세요. JSON은 전체 복원용, CSV는 기록 열람용입니다.',
          cancelLabel: '취소',
          actions: [
            { label: 'JSON (전체 백업)', onPress: () => runExport('json') },
            { label: 'CSV (기록 표)', onPress: () => runExport('csv') },
          ],
        };
      case 'confirmImport':
        return {
          title: '데이터 가져오기',
          message: sheet.summary,
          cancelLabel: '취소',
          actions: [{ label: '전체 교체', destructive: true, onPress: () => confirmImport(sheet.incoming) }],
        };
      case 'confirmReset':
        return {
          title: '데이터 리셋',
          message: '모든 기록·약속·활동을 삭제합니다. 이 작업은 되돌릴 수 없습니다.',
          cancelLabel: '취소',
          actions: [{ label: '전체 삭제', destructive: true, onPress: confirmReset }],
        };
      case 'confirmLogout':
        return {
          title: '로그아웃',
          message: '이 기기에서 로그아웃합니다. 기록 데이터는 기기에 그대로 남아요.',
          cancelLabel: '취소',
          actions: [{ label: '로그아웃', destructive: true, onPress: () => logout() }],
        };
      case 'message':
        return { title: sheet.title, message: sheet.message, cancelLabel: '확인', actions: [] };
      default:
        return { title: '', message: undefined, cancelLabel: '취소', actions: [] };
    }
  })();

  // Theme selector: Light / Dark / 시스템 — fully wired via ThemeContext mode.
  // 시스템 defers to the OS color scheme; light/dark override it.

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

  // 라벨(아이콘) 위 · 컨트롤 전체 폭 아래로 스택. 세그먼트가 좁은 우측 슬롯에서
  // 줄바꿈/오버플로우되던 문제 해결 (다국어 가변 라벨에도 안전).
  const ControlRow = ({
    icon,
    label,
    children,
  }: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
  }) => (
    <View style={{ padding: 14, gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon}
        <T style={{ fontSize: 14, color: c.text }}>{label}</T>
      </View>
      {children}
    </View>
  );

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Title */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 }}>
        <T style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>설정</T>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {/* Profile card → 로컬 프로필 편집 */}
        <Pressable
          onPress={() => nav.navigate('ProfileEdit')}
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
            <T style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>{initial}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{profile.name}</T>
            <T style={{ fontSize: 12, color: c.text2, marginTop: 1 }}>{profile.email}</T>
          </View>
          <Icon.chevronRight size={18} color={c.text3} strokeWidth={2} />
        </Pressable>

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
                <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 9 }}>
                  <T style={{ fontSize: 11, fontWeight: '600', color: c.text2 }}>곧 지원</T>
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
              onPress={() => setSheet({ kind: 'export' })}
            />
            <Divider />
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M12 3v13M7 8l5-5 5 5M5 21h14" />
                </Glyph>
              }
              label="데이터 가져오기"
              value="JSON"
              onPress={runImport}
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
            <ControlRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M12 3a6 6 0 0 0 0 18 9 9 0 0 1 0-18z" />
                </Glyph>
              }
              label="테마"
            >
              <Segmented
                options={[
                  { key: 'light', label: 'Light' },
                  { key: 'dark', label: 'Dark' },
                  { key: 'system', label: '시스템' },
                ]}
                value={mode}
                onChange={setMode}
              />
            </ControlRow>
          </Card>
        </View>

        {/* 계정 */}
        <View>
          <SectionLabel text="계정" />
          <Card>
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M16 17l5-5-5-5M21 12H9M12 19a7 7 0 1 1 0-14" />
                </Glyph>
              }
              label="로그아웃"
              value={user?.email ?? undefined}
              onPress={() => setSheet({ kind: 'confirmLogout' })}
            />
          </Card>
        </View>

        {/* 데이터 초기화 */}
        <View>
          <SectionLabel text="데이터 초기화" />
          <Card>
            <SettingsRow
              icon={
                <Glyph size={18} color={c.error} strokeWidth={1.8}>
                  <Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" />
                </Glyph>
              }
              label="데이터 리셋"
              right={<T style={{ fontSize: 13, fontWeight: '600', color: c.error }}>전체 삭제</T>}
              onPress={() => setSheet({ kind: 'confirmReset' })}
            />
          </Card>
          <T style={{ fontSize: 11, color: c.text3, marginHorizontal: 4, marginTop: 7 }}>
            모든 기록·약속·활동을 지웁니다. 되돌릴 수 없습니다.
          </T>
        </View>
      </View>

      {/* 단일 Modal — 형제 Modal 동시 전환(dismiss+present) race를 피하려고 콘텐츠만 교체한다. */}
      <ActionSheet
        visible={sheet.kind !== 'none'}
        title={sheetView.title}
        message={sheetView.message}
        actions={sheetView.actions}
        cancelLabel={sheetView.cancelLabel}
        onCancel={() => setSheet({ kind: 'none' })}
      />
    </Screen>
  );
}
