import React from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, T, Divider } from '../../components/primitives';
import { Glyph, Path, Icon } from '../../components/Glyph';
import { SettingsRow } from '../../components/Field';
import { ActionSheet } from '../../components/ActionSheet';
import { useStore, useSyncState } from '../../store/StoreContext';
import { useAuth } from '../../auth/AuthContext';
import { exportData, importData } from '../../lib/dataTransfer';
import { backupNow, fetchBackup, deleteBackup } from '../../lib/cloudBackup';
import { deletePushToken } from '../../lib/push';
import { showRewarded } from '../../lib/ads';
import type { StoreState } from '../../store/types';
import { useTheme } from '../../theme/ThemeContext';
import { tr } from '../../i18n/i18n';
import { radius } from '../../theme/tokens';

type SheetState =
  | { kind: 'none' }
  | { kind: 'export' }
  | { kind: 'confirmImport'; incoming: StoreState; summary: string }
  | { kind: 'confirmReset' }
  | { kind: 'confirmLogout' }
  | { kind: 'confirmLogin' }
  | { kind: 'cloud' }
  | { kind: 'message'; title: string; message?: string };

// 마이 — 나 + 내 데이터(프로필 · 백업/동기화 · 초기화 · 로그아웃). 앱 환경설정은 설정 화면(우상단 기어)으로 분리.
export default function MyScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { profile, records, plans, customActivities, onboardingComplete, preferredActivities, replaceAll, markBackedUp } =
    useStore();
  const { user, logout, deleteAccount, isPasswordUser, guest, promptLogin } = useAuth();
  // uid 필요한 기능(백업·피드백): 로그인 상태면 실행, 게스트면 로그인 유도.
  const requireLogin = (action: () => void) => (user ? action() : setSheet({ kind: 'confirmLogin' }));
  const [del, setDel] = React.useState<{ open: boolean; pw: string; busy: boolean; err?: string }>({ open: false, pw: '', busy: false });

  // 계정 삭제 — 서버(백업·토큰) 정리는 best-effort, 그다음 재인증+deleteUser. 로컬 기록은 유지.
  const runDeleteAccount = async () => {
    if (del.busy) return;
    setDel((d) => ({ ...d, busy: true, err: undefined }));
    try {
      if (user) {
        await deleteBackup(user.uid).catch(() => {});
        await deletePushToken(user.uid).catch(() => {});
      }
      await deleteAccount(isPasswordUser ? del.pw : undefined);
      setDel({ open: false, pw: '', busy: false }); // 성공 → 로그아웃 처리(onAuthStateChanged)
    } catch (e) {
      setDel((d) => ({ ...d, busy: false, err: errMessage(e) }));
    }
  };
  const synced = useSyncState() === 'synced';
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
      markBackedUp(); // 현재 데이터 = 클라우드와 동일 → 동기화됨
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
        const when = cloud.updatedAt != null ? new Date(cloud.updatedAt).toLocaleString() : null;
        const status = cloud.loading
          ? tr({ en: 'Checking…', ko: '확인 중…' })
          : cloud.err
            ? cloud.err
            : cloud.data
              ? tr({ en: `Last backup: ${when}`, ko: `마지막 백업: ${when}` })
              : tr({ en: 'No cloud backup yet.', ko: '아직 클라우드 백업이 없어요.' });
        const adNote = tr({ en: 'Watch a short ad to back up to the cloud.', ko: '짧은 광고를 시청하면 클라우드에 백업됩니다.' });
        const photoNote = tr({ en: '※ Photos are not included in the backup.', ko: '※ 사진은 백업에 포함되지 않아요.' });
        const message = cloud.loading || cloud.err ? status : `${status}\n${adNote}\n${photoNote}`;
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
      case 'confirmLogin':
        return {
          title: tr({ en: 'Sign in required', ko: '로그인이 필요해요' }),
          message: tr({ en: 'Sign in to use cloud backup and send feedback.', ko: '클라우드 백업·피드백을 사용하려면 로그인이 필요해요.' }),
          cancelLabel: tr({ en: 'Cancel', ko: '취소' }),
          actions: [{ label: tr({ en: 'Sign in', ko: '로그인' }), onPress: () => promptLogin() }],
        };
      case 'message':
        return { title: sheet.title, message: sheet.message, cancelLabel: tr({ en: 'OK', ko: '확인' }), actions: [] };
      default:
        return { title: '', message: undefined, cancelLabel: tr({ en: 'Cancel', ko: '취소' }), actions: [] };
    }
  })();

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.card, overflow: 'hidden' }}>
      {children}
    </View>
  );

  const SectionLabel = ({ text }: { text: string }) => (
    <T style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginHorizontal: 4, marginBottom: 7 }}>{text}</T>
  );

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Title + 우상단 설정 기어 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 }}>
        <T style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>{tr({ en: 'My', ko: '마이' })}</T>
        <Pressable
          onPress={() => nav.navigate('Settings')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr({ en: 'Settings', ko: '설정' })}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon.settings size={20} color={c.text2} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {/* Profile card → 로컬 프로필 편집 */}
        <Pressable
          onPress={() => nav.navigate('ProfileEdit')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.card, padding: 14 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>{initial}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{profile.name}</T>
            <T style={{ fontSize: 12, color: c.text2, marginTop: 1 }}>{profile.email}</T>
          </View>
          <Icon.chevronRight size={18} color={c.text3} strokeWidth={2} />
        </Pressable>

        {/* 지원 · 소식 */}
        <View>
          <SectionLabel text={tr({ en: 'Support · News', ko: '지원 · 소식' })} />
          <Card>
            <SettingsRow
              icon={<Icon.mail size={18} color={c.text2} strokeWidth={1.8} />}
              label={tr({ en: 'Message the developer', ko: '개발자에게 메세지' })}
              onPress={() => requireLogin(() => nav.navigate('Feedback'))}
            />
            <Divider />
            <SettingsRow
              icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M9 18l6-6-6-6M4 20V4" /></Glyph>}
              label={tr({ en: 'App status', ko: '개발 현황' })}
              onPress={() => nav.navigate('Roadmap')}
            />
          </Card>
        </View>

        {/* 내 데이터: 백업 · 동기화 */}
        <View>
          <SectionLabel text={tr({ en: 'My data', ko: '내 데이터' })} />
          <Card>
            <SettingsRow
              icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M18 10a4 4 0 0 0-.7-7.9A6 6 0 0 0 6 6.5 4.5 4.5 0 0 0 7 15h11a3.5 3.5 0 0 0 0-5z" /></Glyph>}
              label={tr({ en: 'Cloud backup', ko: '클라우드 백업' })}
              value={synced ? tr({ en: 'Backed up', ko: '백업됨' }) : undefined}
              right={
                synced ? undefined : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.warning }} />
                    <T style={{ fontSize: 12, fontWeight: '600', color: c.warning }}>{tr({ en: 'Backup needed', ko: '백업 필요' })}</T>
                  </View>
                )
              }
              onPress={() => requireLogin(openCloud)}
            />
            <Divider />
            <SettingsRow
              icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></Glyph>}
              label={tr({ en: 'Export data', ko: '데이터 내보내기' })}
              value="CSV · JSON"
              onPress={() => setSheet({ kind: 'export' })}
            />
            <Divider />
            <SettingsRow
              icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M12 3v13M7 8l5-5 5 5M5 21h14" /></Glyph>}
              label={tr({ en: 'Import data', ko: '데이터 가져오기' })}
              value="JSON"
              onPress={runImport}
            />
          </Card>
        </View>

        {/* 계정 */}
        <View>
          <SectionLabel text={tr({ en: 'Account', ko: '계정' })} />
          <Card>
            {user ? (
              <>
                <SettingsRow
                  icon={<Glyph size={18} color={c.text2} strokeWidth={1.8}><Path d="M16 17l5-5-5-5M21 12H9M12 19a7 7 0 1 1 0-14" /></Glyph>}
                  label={tr({ en: 'Log out', ko: '로그아웃' })}
                  value={user?.email ?? undefined}
                  onPress={() => setSheet({ kind: 'confirmLogout' })}
                />
                <Divider />
                <SettingsRow
                  icon={<Glyph size={18} color={c.error} strokeWidth={1.8}><Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" /></Glyph>}
                  label={tr({ en: 'Delete account', ko: '계정 삭제' })}
                  right={<T style={{ fontSize: 13, fontWeight: '600', color: c.error }}>{tr({ en: 'Delete', ko: '삭제' })}</T>}
                  onPress={() => setDel({ open: true, pw: '', busy: false })}
                />
              </>
            ) : (
              <SettingsRow
                icon={<Glyph size={18} color={c.accent} strokeWidth={1.8}><Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></Glyph>}
                label={tr({ en: 'Sign in / Sign up', ko: '로그인 / 가입' })}
                value={tr({ en: 'Guest', ko: '게스트' })}
                onPress={promptLogin}
              />
            )}
          </Card>
          {!user ? (
            <T style={{ fontSize: 11, color: c.text3, marginHorizontal: 4, marginTop: 7 }}>
              {tr({ en: 'Sign in to back up and restore across devices.', ko: '로그인하면 클라우드 백업·복원을 쓸 수 있어요.' })}
            </T>
          ) : null}
        </View>

        {/* 데이터 초기화 */}
        <View>
          <SectionLabel text={tr({ en: 'Reset data', ko: '데이터 초기화' })} />
          <Card>
            <SettingsRow
              icon={<Glyph size={18} color={c.error} strokeWidth={1.8}><Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" /></Glyph>}
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

      <ActionSheet
        visible={sheet.kind !== 'none'}
        title={sheetView.title}
        message={sheetView.message}
        actions={sheetView.actions}
        cancelLabel={sheetView.cancelLabel}
        onCancel={() => setSheet({ kind: 'none' })}
      />

      {/* 계정 삭제 — 비번 provider면 재인증 입력. 로컬 기록은 유지된다는 안내 포함. */}
      <Modal visible={del.open} transparent animationType="fade" onRequestClose={() => !del.busy && setDel({ open: false, pw: '', busy: false })}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: c.surface, borderRadius: 18, padding: 20, gap: 12 }}>
            <T style={{ fontSize: 17, fontWeight: '700', color: c.text }}>{tr({ en: 'Delete account', ko: '계정 삭제' })}</T>
            <T style={{ fontSize: 13, color: c.text2, lineHeight: 19 }}>
              {tr({ en: 'Your account and cloud backup are permanently deleted. Records on this device are kept.', ko: '계정과 클라우드 백업이 영구 삭제돼요. 이 기기의 기록은 유지됩니다.' })}
            </T>
            {isPasswordUser ? (
              <TextInput
                value={del.pw}
                onChangeText={(t) => setDel((d) => ({ ...d, pw: t }))}
                placeholder={tr({ en: 'Password', ko: '비밀번호' })}
                placeholderTextColor={c.text3}
                secureTextEntry
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: c.text, backgroundColor: c.surfaceAlt }}
              />
            ) : null}
            {del.err ? <T style={{ fontSize: 12, color: c.error }}>{del.err}</T> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Pressable disabled={del.busy} onPress={() => setDel({ open: false, pw: '', busy: false })} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center' }}>
                <T style={{ fontSize: 14, fontWeight: '600', color: c.text2 }}>{tr({ en: 'Cancel', ko: '취소' })}</T>
              </Pressable>
              <Pressable
                disabled={del.busy || (isPasswordUser && !del.pw)}
                onPress={runDeleteAccount}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.error, alignItems: 'center', opacity: del.busy || (isPasswordUser && !del.pw) ? 0.5 : 1 }}
              >
                <T style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{del.busy ? tr({ en: 'Deleting…', ko: '삭제 중…' }) : tr({ en: 'Delete', ko: '삭제' })}</T>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
