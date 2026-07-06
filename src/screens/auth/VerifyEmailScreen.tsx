import React from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { Glyph, Path, Rect } from '../../components/Glyph';
import { PrimaryButton, BackButton } from '../../components/auth-ui';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { tr } from '../../i18n/i18n';

// 0.4 이메일 인증 대기 — authed + 미인증 상태의 루트 게이트. 인증되면 루트가 앱으로 전환.
export default function VerifyEmailScreen() {
  const { c } = useTheme();
  const { user, resendVerification, refreshVerified, logout } = useAuth();
  const [cooldown, setCooldown] = React.useState(0);

  // 주기적으로 인증 여부 폴링(4s). 인증되면 refreshVerified가 context user를 갱신 → 루트 재평가.
  React.useEffect(() => {
    const t = setInterval(() => {
      refreshVerified().catch(() => {});
    }, 4000);
    return () => clearInterval(t);
  }, [refreshVerified]);

  // 재전송 쿨다운 카운트다운.
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendVerification();
      setCooldown(30);
    } catch (e) {
      Alert.alert(tr({ en: 'Resend', ko: '다시 보내기' }), e instanceof Error ? e.message : tr({ en: 'Failed to send.', ko: '전송에 실패했어요.' }));
    }
  };

  const openMail = () => {
    Linking.openURL('message://').catch(() => Linking.openURL('mailto:').catch(() => {}));
  };

  return (
    <Screen edges={['top', 'bottom']} scroll={false} contentStyle={{ flex: 1, paddingHorizontal: 26 }}>
      <View style={{ paddingTop: 6, marginHorizontal: -8 }}>
        <BackButton onPress={() => logout()} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            backgroundColor: c.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Glyph size={46} color={c.accent} strokeWidth={1.7}>
            <Rect x="3" y="5" width="18" height="14" rx="2.5" />
            <Path d="M4 7l8 6 8-6" />
          </Glyph>
          <View
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: c.success,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: c.bg,
            }}
          >
            <Glyph size={17} color="#fff" strokeWidth={3}>
              <Path d="M5 12l5 5L20 6" />
            </Glyph>
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: c.text }}>{tr({ en: 'Check your email', ko: '이메일을 확인해주세요' })}</Text>
          <Text style={{ fontSize: 14, color: c.text2, lineHeight: 22, textAlign: 'center', marginTop: 10 }}>
            {tr({ en: 'We sent a verification link to\n', ko: '' })}
            <Text style={{ color: c.text, fontWeight: '600' }}>{user?.email ?? tr({ en: 'your email', ko: '가입한 이메일' })}</Text>
            {tr({ en: '.\nTap the link to finish signing up.', ko: ' 으로\n인증 링크를 보냈어요. 링크를 누르면\n가입이 완료됩니다.' })}
          </Text>
        </View>

        <View style={{ width: '100%', gap: 10, marginTop: 4 }}>
          <PrimaryButton label={tr({ en: 'Open email app', ko: '이메일 앱 열기' })} onPress={openMail} />
          <Pressable onPress={onResend} disabled={cooldown > 0} hitSlop={6} style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: cooldown > 0 ? c.text3 : c.text2 }}>
              {cooldown > 0
                ? tr({ en: `Resend (${cooldown}s)`, ko: `다시 보내기 (${cooldown}s)` })
                : tr({ en: 'Didn’t get it? · Resend', ko: '메일이 안 왔어요 · 다시 보내기' })}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => logout()} hitSlop={6} style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text style={{ fontSize: 12.5, color: c.text3 }}>
          {tr({ en: 'Sign up with a ', ko: '다른 이메일로 ' })}
          <Text style={{ color: c.accent, fontWeight: '600' }}>{tr({ en: 'different email', ko: '가입하기' })}</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}
