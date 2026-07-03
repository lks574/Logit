import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Glyph, Path, Rect } from '../../components/Glyph';
import { AuthInput, AuthIcon, PrimaryButton, BackButton, FooterLink } from '../../components/auth-ui';
import { useAuth } from '../../auth/AuthContext';
import { authErrorMessage } from '../../auth/errors';
import { useTheme } from '../../theme/ThemeContext';

const EMAIL_OK = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// 0.5 비밀번호 재설정 — 이메일로 재설정 링크 발송.
export default function PasswordResetScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { resetPassword } = useAuth();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string>();
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onSend = async () => {
    if (loading) return;
    if (!EMAIL_OK(email)) return setError('이메일 형식이 올바르지 않아요.');
    setError(undefined);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
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

      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 18,
          backgroundColor: c.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Glyph size={30} color={c.accent} strokeWidth={1.8}>
          <Rect x="4" y="10" width="16" height="10" rx="2.5" />
          <Path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
        </Glyph>
      </View>

      <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.72, color: c.text }}>비밀번호 재설정</Text>
      <Text style={{ fontSize: 14, color: c.text2, lineHeight: 22, marginTop: 8 }}>
        가입한 이메일을 입력하면 재설정{'\n'}링크를 보내드려요.
      </Text>

      <View style={{ gap: 14, marginTop: 26 }}>
        <AuthInput
          label="이메일"
          icon={<AuthIcon.mail size={17} color={c.text3} />}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setSent(false);
          }}
          placeholder="name@email.com"
          keyboardType="email-address"
          error={error}
          onSubmitEditing={onSend}
        />
        {sent ? (
          <Text style={{ fontSize: 12.5, color: c.success }}>재설정 링크를 보냈어요. 메일함을 확인해주세요.</Text>
        ) : null}
        <PrimaryButton label="재설정 링크 보내기" onPress={onSend} loading={loading} disabled={email.trim().length === 0} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          backgroundColor: c.accentSoft,
          borderRadius: 12,
          padding: 13,
          marginTop: 20,
        }}
      >
        <AuthIcon.info size={17} color={c.accent} />
        <Text style={{ flex: 1, fontSize: 12.5, color: c.text2, lineHeight: 18 }}>
          Google·Apple로 가입했다면 해당 버튼으로 로그인해주세요.
        </Text>
      </View>

      <View style={{ marginTop: 24 }}>
        <FooterLink text="비밀번호가 기억났어요" linkText="로그인" onPress={() => nav.goBack()} />
      </View>
    </Screen>
  );
}
