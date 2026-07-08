import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, T } from '../../components/primitives';
import { Icon } from '../../components/Glyph';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { tr } from '../../i18n/i18n';
import { sendFeedback } from '../../lib/feedback';

// 개발자에게 메세지 — 자유 입력 → Firestore feedback 컬렉션. 개발자는 콘솔에서 확인.
export default function FeedbackScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [text, setText] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const canSend = text.trim().length > 0 && status !== 'sending';

  const onSend = async () => {
    if (!canSend || !user) return;
    setStatus('sending');
    try {
      await sendFeedback({ message: text, uid: user.uid, email: user.email });
      setStatus('sent');
      setText('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header: 뒤로 / 제목 */}
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
        <T style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{tr({ en: 'Message the developer', ko: '개발자에게 메세지' })}</T>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <T style={{ fontSize: 13, color: c.text2, lineHeight: 19 }}>
          {tr({
            en: 'Bugs, ideas, anything — it goes straight to the developer. We may not reply individually.',
            ko: '버그·아이디어 등 무엇이든 개발자에게 바로 전달됩니다. 개별 답변은 어려울 수 있어요.',
          })}
        </T>

        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 14 }}>
          <TextInput
            value={text}
            onChangeText={(v) => {
              setText(v);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder={tr({ en: 'Write your message…', ko: '메세지를 입력하세요…' })}
            placeholderTextColor={c.text3}
            multiline
            textAlignVertical="top"
            style={{ fontSize: 15, color: c.text, padding: 0, minHeight: 140 }}
          />
        </View>

        {status === 'sent' ? (
          <T style={{ fontSize: 13, color: c.accent }}>
            {tr({ en: 'Sent — thank you!', ko: '전송했어요. 감사합니다!' })}
          </T>
        ) : status === 'error' ? (
          <T style={{ fontSize: 13, color: c.error }}>
            {tr({ en: 'Failed to send. Please check your connection and try again.', ko: '전송에 실패했어요. 연결을 확인하고 다시 시도해 주세요.' })}
          </T>
        ) : null}

        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: canSend ? c.accent : c.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T style={{ fontSize: 15, fontWeight: '700', color: canSend ? '#fff' : c.text3 }}>
            {status === 'sending' ? tr({ en: 'Sending…', ko: '전송 중…' }) : tr({ en: 'Send', ko: '보내기' })}
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}
