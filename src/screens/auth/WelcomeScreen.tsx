import React from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Glyph, Path } from '../../components/Glyph';
import { PrimaryButton, SocialButton, OrDivider, FooterLink } from '../../components/auth-ui';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

// 0.1 시작 — 첫 진입. 인증 방식 선택.
export default function WelcomeScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { signInWithGoogle, signInWithApple } = useAuth();

  const social = (fn: () => Promise<void>) => async () => {
    try {
      await fn();
    } catch (e) {
      Alert.alert('로그인', e instanceof Error ? e.message : '로그인에 실패했어요.');
    }
  };

  return (
    <Screen edges={['top', 'bottom']} scroll={false} contentStyle={{ flex: 1, paddingHorizontal: 26 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: c.accent,
            shadowOpacity: 0.4,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <Glyph size={38} color="#fff" strokeWidth={2.2}>
            <Path d="M4 19 L9 12 L13 15 L20 5" />
          </Glyph>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '700', letterSpacing: -0.84, color: c.text }}>Logit</Text>
          <Text style={{ fontSize: 14.5, color: c.text2, lineHeight: 22, textAlign: 'center', marginTop: 10 }}>
            운동도, 공연도, 하루의 기록도.{'\n'}흩어진 순간을 한 곳에 쌓아요.
          </Text>
        </View>
      </View>

      <View style={{ gap: 10, paddingBottom: 8 }}>
        <PrimaryButton label="이메일로 시작하기" onPress={() => nav.navigate('SignUp')} />
        <View style={{ marginVertical: 4 }}>
          <OrDivider />
        </View>
        <SocialButton provider="google" label="Google로 계속하기" onPress={social(signInWithGoogle)} />
        <SocialButton provider="apple" label="Apple로 계속하기" onPress={social(signInWithApple)} />
        <View style={{ marginTop: 6 }}>
          <FooterLink text="이미 계정이 있으신가요?" linkText="로그인" onPress={() => nav.navigate('SignIn')} />
        </View>
      </View>
    </Screen>
  );
}
