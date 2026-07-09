import React from 'react';
import { Alert, AppState, Linking, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTheme } from '../theme/ThemeContext';
import { tr } from '../i18n/i18n';
import { fetchVersionGate } from '../lib/remoteConfig';
import { evalGate, GateStatus, STORE_URL, VersionGate } from '../lib/version';

const CURRENT = Constants.expoConfig?.version ?? '0.0.0';

// 앱 버전 게이트 — Remote Config로 강제/선택 업데이트를 제어한다.
// force: 차단 전체화면(닫기 불가). optional: 닫기 가능한 안내 모달. ok: 그대로 통과.
export function UpdateGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<GateStatus>('ok'); // 판정 전엔 통과(깜빡임 방지)
  const [gate, setGate] = React.useState<VersionGate | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  // 앱 진입 시 1회 게이트를 가져와 판정. force면 즉시 강제 알럿을 띄운다.
  React.useEffect(() => {
    let alive = true;
    fetchVersionGate().then((g) => {
      if (!alive) return;
      setGate(g);
      const s = evalGate(CURRENT, g);
      setStatus(s);
      if (s === 'force') showForceAlert(g.latest);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 백그라운드 갔다 돌아와도 여전히 force면 알럿을 다시 띄워 우회를 막는다.
  React.useEffect(() => {
    if (status !== 'force' || !gate) return;
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') showForceAlert(gate.latest);
    });
    return () => sub.remove();
  }, [status, gate]);

  if (status === 'force' && gate) return <ForceUpdateScreen gate={gate} />;

  return (
    <>
      {children}
      {status === 'optional' && gate && !dismissed ? (
        <UpdateNotice gate={gate} onDismiss={() => setDismissed(true)} />
      ) : null}
    </>
  );
}

const openStore = () => {
  if (STORE_URL) Linking.openURL(STORE_URL).catch(() => {});
};

// 강제 업데이트 알럿 — 닫기 불가, 단일 버튼으로 스토어 이동만 가능.
function showForceAlert(latest: string) {
  Alert.alert(
    tr({ en: 'Update required', ko: '업데이트가 필요해요' }),
    tr({
      en: `Version ${latest} is required to keep using the app.`,
      ko: `계속 사용하려면 ${latest} 버전으로 업데이트해야 해요.`,
    }),
    [{ text: tr({ en: 'Go to Store', ko: '스토어로 이동' }), onPress: openStore }],
    { cancelable: false },
  );
}

function ForceUpdateScreen({ gate }: { gate: VersionGate }) {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 16 }}>
        <View style={{ width: 84, height: 84, borderRadius: 24, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 40 }}>🚀</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.text, textAlign: 'center' }}>
          {tr({ en: 'Update required', ko: '업데이트가 필요해요' })}
        </Text>
        <Text style={{ fontSize: 13.5, color: c.text2, textAlign: 'center', lineHeight: 20 }}>
          {tr({
            en: `A newer version (${gate.latest}) is required to keep using the app.`,
            ko: `계속 사용하려면 최신 버전(${gate.latest})으로 업데이트해야 해요.`,
          })}
        </Text>
        <Pressable
          onPress={openStore}
          style={{ marginTop: 8, backgroundColor: c.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, width: '100%', maxWidth: 260, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{tr({ en: 'Update', ko: '업데이트하기' })}</Text>
        </Pressable>
        <Text style={{ fontSize: 11, color: c.text3 }}>{tr({ en: `Current v${CURRENT}`, ko: `현재 v${CURRENT}` })}</Text>
      </View>
    </SafeAreaView>
  );
}

function UpdateNotice({ gate, onDismiss }: { gate: VersionGate; onDismiss: () => void }) {
  const { c } = useTheme();
  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={{ width: '100%', maxWidth: 320, backgroundColor: c.surface, borderRadius: 18, padding: 20, gap: 10 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>{tr({ en: 'New version available', ko: '새 버전이 있어요' })}</Text>
          <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19 }}>
            {tr({ en: `Version ${gate.latest} is out. Update for the latest features.`, ko: `${gate.latest} 버전이 나왔어요. 최신 기능을 사용해 보세요.` })}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Pressable onPress={onDismiss} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text2 }}>{tr({ en: 'Later', ko: '나중에' })}</Text>
            </Pressable>
            <Pressable onPress={() => { openStore(); onDismiss(); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{tr({ en: 'Update', ko: '업데이트' })}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
