import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Glyph, Path } from '../../components/Glyph';
import { AuthInput, AuthIcon, PrimaryButton, BackButton, FooterLink } from '../../components/auth-ui';
import { useAuth } from '../../auth/AuthContext';
import { authErrorMessage } from '../../auth/errors';
import { useTheme } from '../../theme/ThemeContext';

const PW_OK = (pw: string) => pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
const EMAIL_OK = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// 0.3 회원가입 — 닉네임 + 이메일 + 비밀번호 + 약관 동의.
export default function SignUpScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { signUp } = useAuth();
  const [nickname, setNickname] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [agreed, setAgreed] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);

  const canSubmit = nickname.trim().length > 0 && EMAIL_OK(email) && PW_OK(password) && agreed;

  const onSignUp = async () => {
    if (loading) return;
    if (!EMAIL_OK(email)) return setError('이메일 형식이 올바르지 않아요.');
    if (!PW_OK(password)) return setError('비밀번호는 8자 이상, 영문과 숫자를 함께 써주세요.');
    if (!agreed) return setError('약관에 동의해주세요.');
    setError(undefined);
    setLoading(true);
    try {
      await signUp(nickname, email, password);
      // 성공 → 루트 게이팅이 인증 대기 화면으로 전환(authed + 미인증).
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingHorizontal: 26, paddingBottom: 16 }}>
      <View style={{ marginHorizontal: -8, marginBottom: 14 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.72, color: c.text }}>계정 만들기</Text>
      <Text style={{ fontSize: 14, color: c.text2, marginTop: 6 }}>이메일 하나면 충분해요. 30초면 끝.</Text>

      <View style={{ gap: 13, marginTop: 24 }}>
        <AuthInput
          label="닉네임"
          icon={<AuthIcon.user size={17} color={c.text3} />}
          value={nickname}
          onChangeText={setNickname}
          placeholder="기록하는 사람"
          autoCapitalize="words"
        />
        <AuthInput
          label="이메일"
          icon={<AuthIcon.mail size={17} color={c.text3} />}
          value={email}
          onChangeText={setEmail}
          placeholder="name@email.com"
          keyboardType="email-address"
        />
        <View>
          <AuthInput
            label="비밀번호"
            icon={<AuthIcon.lock size={17} color={c.text3} />}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secure
          />
          <Text style={{ fontSize: 11.5, color: c.text3, paddingLeft: 2, marginTop: 6 }}>
            8자 이상 · 영문과 숫자를 함께
          </Text>
        </View>

        {/* 약관 동의 */}
        <Pressable onPress={() => setAgreed((v) => !v)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 2 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              marginTop: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: agreed ? c.accent : 'transparent',
              borderWidth: agreed ? 0 : 1.5,
              borderColor: c.border,
            }}
          >
            {agreed ? (
              <Glyph size={13} color="#fff" strokeWidth={3}>
                <Path d="M5 12l5 5L20 6" />
              </Glyph>
            ) : null}
          </View>
          <Text style={{ flex: 1, fontSize: 12.5, color: c.text2, lineHeight: 19 }}>
            <Text style={{ color: c.text, fontWeight: '600' }}>이용약관</Text> 및{' '}
            <Text style={{ color: c.text, fontWeight: '600' }}>개인정보 처리방침</Text>에 동의합니다.
          </Text>
        </Pressable>

        {error ? <Text style={{ fontSize: 12, color: c.error }}>{error}</Text> : null}

        <PrimaryButton label="가입하고 시작하기" onPress={onSignUp} loading={loading} disabled={!canSubmit} />
      </View>

      <View style={{ marginTop: 20 }}>
        <FooterLink text="이미 계정이 있으신가요?" linkText="로그인" onPress={() => nav.navigate('SignIn')} />
      </View>
    </Screen>
  );
}
