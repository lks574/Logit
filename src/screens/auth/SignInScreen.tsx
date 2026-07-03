import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { AuthInput, AuthIcon, PrimaryButton, SocialButton, OrDivider, BackButton, FooterLink } from '../../components/auth-ui';
import { useAuth } from '../../auth/AuthContext';
import { authErrorMessage } from '../../auth/errors';
import { useTheme } from '../../theme/ThemeContext';

// 0.2 로그인 — 이메일 + 비밀번호.
export default function SignInScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const onLogin = async () => {
    if (!canSubmit || loading) return;
    setError(undefined);
    setLoading(true);
    try {
      await signIn(email, password);
      // 성공 시 루트 게이팅이 화면을 전환한다(미인증이면 인증 대기).
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const social = (fn: () => Promise<void>) => async () => {
    try {
      await fn();
    } catch (e) {
      Alert.alert('로그인', e instanceof Error ? e.message : '로그인에 실패했어요.');
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingHorizontal: 26, paddingBottom: 16 }}>
      <View style={{ marginHorizontal: -8, marginBottom: 14 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.72, color: c.text }}>다시 오셨네요</Text>
      <Text style={{ fontSize: 14, color: c.text2, marginTop: 6 }}>이메일로 로그인하고 이어서 기록해요.</Text>

      <View style={{ gap: 14, marginTop: 26 }}>
        <AuthInput
          label="이메일"
          icon={<AuthIcon.mail size={17} color={c.text3} />}
          value={email}
          onChangeText={setEmail}
          placeholder="name@email.com"
          keyboardType="email-address"
          error={error ? ' ' : undefined}
        />
        <AuthInput
          label="비밀번호"
          icon={<AuthIcon.lock size={17} color={c.text3} />}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secure
          error={error}
          onSubmitEditing={onLogin}
        />
        <Pressable onPress={() => nav.navigate('PasswordReset')} hitSlop={6} style={{ alignSelf: 'flex-end', marginTop: -4 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.accent }}>비밀번호를 잊으셨나요?</Text>
        </Pressable>
        <PrimaryButton label="로그인" onPress={onLogin} loading={loading} disabled={!canSubmit} />
      </View>

      <View style={{ marginVertical: 20 }}>
        <OrDivider />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SocialButton provider="google" label="Google" onPress={social(signInWithGoogle)} flex />
        <SocialButton provider="apple" label="Apple" onPress={social(signInWithApple)} flex />
      </View>

      <View style={{ marginTop: 24 }}>
        <FooterLink text="아직 계정이 없으신가요?" linkText="회원가입" onPress={() => nav.navigate('SignUp')} />
      </View>
    </Screen>
  );
}
