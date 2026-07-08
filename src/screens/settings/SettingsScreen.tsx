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
import { backupNow, fetchBackup } from '../../lib/cloudBackup';
import { showRewarded } from '../../lib/ads';
import type { StoreState } from '../../store/types';
import { useTheme } from '../../theme/ThemeContext';
import { useLang, tr } from '../../i18n/i18n';
import { radius } from '../../theme/tokens';

type SheetState =
  | { kind: 'none' }
  | { kind: 'export' }
  | { kind: 'confirmImport'; incoming: StoreState; summary: string }
  | { kind: 'confirmReset' }
  | { kind: 'confirmLogout' }
  | { kind: 'cloud' }
  | { kind: 'message'; title: string; message?: string };

// 4.8 설정 — profile card, grouped surface cards with rows + dividers.
export default function SettingsScreen() {
  const { c, mode, setMode } = useTheme();
  const { mode: langMode, setMode: setLangMode } = useLang();
  const nav = useNavigation<any>();
  const { profile, records, plans, customActivities, onboardingComplete, preferredActivities, replaceAll } =
    useStore();
  const { user, logout } = useAuth();
  const initial = (profile.name.trim()[0] ?? '?').toUpperCase();
  const [sheet, setSheet] = React.useState<SheetState>({ kind: 'none' });

  const errMessage = (e: unknown) =>
    e instanceof Error ? e.message : tr({ en: 'An unknown error occurred.', ko: '알 수 없는 오류가 발생했습니다.' });

  // 보상형 광고 게이트 — 내보내기·복원·백업 실행 전 광고 시청. 끝까지 안 보면 false.
  const requireAd = async (): Promise<boolean> => {
    setSheet({ kind: 'message', title: tr({ en: 'Ad', ko: '광고' }), message: tr({ en: 'Loading ad…', ko: '광고 준비 중…' }) });
    const ok = await showRewarded();
    if (!ok) {
      setSheet({ kind: 'message', title: tr({ en: 'Canceled', ko: '취소됨' }), message: tr({ en: 'Watch the ad to the end to continue.', ko: '광고를 끝까지 시청해야 진행됩니다.' }) });
    }
    return ok;
  };

  const runExport = async (format: 'json' | 'csv') => {
    if (!(await requireAd())) return;
    // 시트를 먼저 none으로 닫지 않는다 — 단일 Modal이 dismiss→재present되는 race를 피하고,
    // 결과 message로 콘텐츠만 교체한다.
    try {
      const msg = await exportData(
        { records, plans, customActivities, profile, onboardingComplete, preferredActivities },
        format,
      );
      setSheet({ kind: 'message', title: tr({ en: 'Export', ko: '내보내기' }), message: msg });
    } catch (e) {
      setSheet({ kind: 'message', title: tr({ en: 'Export failed', ko: '내보내기 실패' }), message: errMessage(e) });
    }
  };

  const runImport = async () => {
    try {
      const incoming = await importData();
      if (!incoming) return; // 사용자 취소
      const summary = tr({
        en: `Importing ${incoming.records.length} records · ${incoming.plans.length} plans. All current data will be replaced.`,
        ko: `기록 ${incoming.records.length}개 · 약속 ${incoming.plans.length}개를 가져옵니다. 현재 데이터는 모두 대체됩니다.`,
      });
      setSheet({ kind: 'confirmImport', incoming, summary });
    } catch (e) {
      setSheet({ kind: 'message', title: tr({ en: 'Import failed', ko: '가져오기 실패' }), message: errMessage(e) });
    }
  };

  const confirmImport = async (incoming: StoreState) => {
    if (!(await requireAd())) return;
    try {
      await replaceAll(incoming);
      setSheet({ kind: 'message', title: tr({ en: 'Import complete', ko: '가져오기 완료' }), message: tr({ en: 'Your data has been restored.', ko: '데이터를 복원했습니다.' }) });
    } catch (e) {
      setSheet({ kind: 'message', title: tr({ en: 'Import failed', ko: '가져오기 실패' }), message: tr({ en: 'Failed to save. Please check your storage space.', ko: '저장에 실패했습니다. 저장 공간을 확인해 주세요.' }) });
    }
  };

  // ── 클라우드 백업 ─────────────────────────────────────────────
  const currentState = (): StoreState => ({ records, plans, customActivities, profile, onboardingComplete, preferredActivities });
  const [cloud, setCloud] = React.useState<{ loading: boolean; data?: StoreState | null; updatedAt?: number | null; err?: string }>({ loading: false });

  const openCloud = () => {
    setSheet({ kind: 'cloud' });
    if (!user) {
      setCloud({ loading: false, err: tr({ en: 'Sign in required.', ko: '로그인이 필요합니다.' }) });
      return;
    }
    setCloud({ loading: true });
    fetchBackup(user.uid)
      .then((b) => setCloud({ loading: false, data: b?.data ?? null, updatedAt: b?.updatedAt ?? null }))
      .catch((e) => setCloud({ loading: false, err: errMessage(e) }));
  };

  const doBackup = async () => {
    if (!user) return;
    if (!(await requireAd())) return; // 광고 끝까지 시청해야 백업
    setSheet({ kind: 'message', title: tr({ en: 'Cloud backup', ko: '클라우드 백업' }), message: tr({ en: 'Backing up…', ko: '백업 중…' }) });
    try {
      await backupNow(user.uid, currentState());
      setSheet({ kind: 'message', title: tr({ en: 'Backup complete', ko: '백업 완료' }), message: tr({ en: 'Saved to the cloud.', ko: '클라우드에 저장했어요.' }) });
    } catch (e) {
      setSheet({ kind: 'message', title: tr({ en: 'Backup failed', ko: '백업 실패' }), message: errMessage(e) });
    }
  };

  const doRestore = () => {
    if (!cloud.data) return;
    const d = cloud.data;
    const summary = tr({
      en: `Restoring ${d.records.length} records · ${d.plans.length} plans from the cloud. All current data will be replaced.`,
      ko: `클라우드에서 기록 ${d.records.length}개 · 약속 ${d.plans.length}개를 복원합니다. 현재 데이터는 모두 대체됩니다.`,
    });
    setSheet({ kind: 'confirmImport', incoming: d, summary });
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
      setSheet({ kind: 'message', title: tr({ en: 'Reset complete', ko: '초기화 완료' }), message: tr({ en: 'All records and plans have been deleted.', ko: '모든 기록과 약속을 삭제했습니다.' }) });
    } catch (e) {
      setSheet({ kind: 'message', title: tr({ en: 'Reset failed', ko: '초기화 실패' }), message: tr({ en: 'Failed to delete. Please try again.', ko: '삭제에 실패했습니다. 다시 시도해 주세요.' }) });
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
          title: tr({ en: 'Export data', ko: '데이터 내보내기' }),
          message: tr({ en: 'Choose a format. JSON is for full restore, CSV is for viewing records.', ko: '형식을 선택하세요. JSON은 전체 복원용, CSV는 기록 열람용입니다.' }),
          cancelLabel: tr({ en: 'Cancel', ko: '취소' }),
          actions: [
            { label: tr({ en: 'JSON (full backup)', ko: 'JSON (전체 백업)' }), onPress: () => runExport('json') },
            { label: tr({ en: 'CSV (records table)', ko: 'CSV (기록 표)' }), onPress: () => runExport('csv') },
          ],
        };
      case 'confirmImport':
        return {
          title: tr({ en: 'Import data', ko: '데이터 가져오기' }),
          message: sheet.summary,
          cancelLabel: tr({ en: 'Cancel', ko: '취소' }),
          actions: [{ label: tr({ en: 'Replace all', ko: '전체 교체' }), destructive: true, onPress: () => confirmImport(sheet.incoming) }],
        };
      case 'cloud': {
        const when =
          cloud.updatedAt != null
            ? new Date(cloud.updatedAt).toLocaleString()
            : null;
        const status = cloud.loading
          ? tr({ en: 'Checking…', ko: '확인 중…' })
          : cloud.err
            ? cloud.err
            : cloud.data
              ? tr({ en: `Last backup: ${when}`, ko: `마지막 백업: ${when}` })
              : tr({ en: 'No cloud backup yet.', ko: '아직 클라우드 백업이 없어요.' });
        // 보상형 광고 안내 문구.
        const adNote = tr({ en: 'Watch a short ad to back up to the cloud.', ko: '짧은 광고를 시청하면 클라우드에 백업됩니다.' });
        const message = cloud.loading || cloud.err ? status : `${status}\n${adNote}`;
        return {
          title: tr({ en: 'Cloud backup', ko: '클라우드 백업' }),
          message,
          cancelLabel: tr({ en: 'Cancel', ko: '취소' }),
          actions: [
            { label: tr({ en: 'Back up now', ko: '지금 백업' }), onPress: doBackup },
            ...(cloud.data ? [{ label: tr({ en: 'Restore', ko: '복원' }), onPress: doRestore }] : []),
          ],
        };
      }
      case 'confirmReset':
        return {
          title: tr({ en: 'Reset data', ko: '데이터 리셋' }),
          message: tr({ en: 'This deletes all records, plans, and activities. This cannot be undone.', ko: '모든 기록·약속·활동을 삭제합니다. 이 작업은 되돌릴 수 없습니다.' }),
          cancelLabel: tr({ en: 'Cancel', ko: '취소' }),
          actions: [{ label: tr({ en: 'Delete all', ko: '전체 삭제' }), destructive: true, onPress: confirmReset }],
        };
      case 'confirmLogout':
        return {
          title: tr({ en: 'Log out', ko: '로그아웃' }),
          message: tr({ en: 'You will be logged out on this device. Your record data stays on the device.', ko: '이 기기에서 로그아웃합니다. 기록 데이터는 기기에 그대로 남아요.' }),
          cancelLabel: tr({ en: 'Cancel', ko: '취소' }),
          actions: [{ label: tr({ en: 'Log out', ko: '로그아웃' }), destructive: true, onPress: () => logout() }],
        };
      case 'message':
        return { title: sheet.title, message: sheet.message, cancelLabel: tr({ en: 'OK', ko: '확인' }), actions: [] };
      default:
        return { title: '', message: undefined, cancelLabel: tr({ en: 'Cancel', ko: '취소' }), actions: [] };
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
        <T style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>{tr({ en: 'Settings', ko: '설정' })}</T>
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
          <SectionLabel text={tr({ en: 'Backup · Sync', ko: '백업 · 동기화' })} />
          <Card>
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M18 10a4 4 0 0 0-.7-7.9A6 6 0 0 0 6 6.5 4.5 4.5 0 0 0 7 15h11a3.5 3.5 0 0 0 0-5z" />
                </Glyph>
              }
              label={tr({ en: 'Cloud backup', ko: '클라우드 백업' })}
              value={tr({ en: 'Back up · Restore', ko: '백업 · 복원' })}
              onPress={openCloud}
            />
            <Divider />
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
                </Glyph>
              }
              label={tr({ en: 'Export data', ko: '데이터 내보내기' })}
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
              label={tr({ en: 'Import data', ko: '데이터 가져오기' })}
              value="JSON"
              onPress={runImport}
            />
          </Card>
        </View>

        {/* 앱 */}
        <View>
          <SectionLabel text={tr({ en: 'App', ko: '앱' })} />
          <Card>
            <ControlRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M12 3a6 6 0 0 0 0 18 9 9 0 0 1 0-18z" />
                </Glyph>
              }
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
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M5 8h14M9 4c-1.5 4-1.5 12 0 16M12 4v16" />
                  <Path d="M4 20c3-1 5-3 6-6M14 14c1.5 2 3.5 4 6 6" />
                </Glyph>
              }
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

        {/* 계정 */}
        <View>
          <SectionLabel text={tr({ en: 'Account', ko: '계정' })} />
          <Card>
            <SettingsRow
              icon={
                <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                  <Path d="M16 17l5-5-5-5M21 12H9M12 19a7 7 0 1 1 0-14" />
                </Glyph>
              }
              label={tr({ en: 'Log out', ko: '로그아웃' })}
              value={user?.email ?? undefined}
              onPress={() => setSheet({ kind: 'confirmLogout' })}
            />
          </Card>
        </View>

        {/* 데이터 초기화 */}
        <View>
          <SectionLabel text={tr({ en: 'Reset data', ko: '데이터 초기화' })} />
          <Card>
            <SettingsRow
              icon={
                <Glyph size={18} color={c.error} strokeWidth={1.8}>
                  <Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" />
                </Glyph>
              }
              label={tr({ en: 'Reset data', ko: '데이터 리셋' })}
              right={<T style={{ fontSize: 13, fontWeight: '600', color: c.error }}>{tr({ en: 'Delete all', ko: '전체 삭제' })}</T>}
              onPress={() => setSheet({ kind: 'confirmReset' })}
            />
          </Card>
          <T style={{ fontSize: 11, color: c.text3, marginHorizontal: 4, marginTop: 7 }}>
            {tr({ en: 'Erases all records, plans, and activities. This cannot be undone.', ko: '모든 기록·약속·활동을 지웁니다. 되돌릴 수 없습니다.' })}
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
