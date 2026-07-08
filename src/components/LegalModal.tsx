import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Screen } from './primitives';
import { Glyph, Path } from './Glyph';
import { useTheme } from '../theme/ThemeContext';
import { tr, type Msg } from '../i18n/i18n';

// 약관·개인정보처리방침 — 가입(Auth 스택)·설정(App 스택) 양쪽에서 열려야 해서
// 네비게이터에 등록하는 대신 자체 완결 Modal로 둔다. 스토어 심사용 "호스팅 URL"은
// 이 텍스트를 그대로 웹에 올려 app.json/스토어 메타데이터에 넣을 것.
// ponytail: 문의 연락처는 실제 값으로 교체 필요.
const CONTACT = 'logit.app.help@gmail.com';
const EFFECTIVE = '2026-07-08';

type Section = { heading: Msg; body: Msg };

const PRIVACY: Section[] = [
  {
    heading: { en: '1. Information we collect', ko: '1. 수집하는 정보' },
    body: {
      en: 'Account info you provide (email, nickname), the records you create (workouts, performances, notes, dates, places), photos you attach, and — when ads are shown — advertising identifiers and device info collected by Google AdMob.',
      ko: '가입 시 입력한 계정 정보(이메일·닉네임), 사용자가 작성한 기록(운동·공연·메모·날짜·장소), 첨부한 사진, 그리고 광고 노출 시 Google AdMob이 수집하는 광고 식별자·기기 정보를 수집합니다.',
    },
  },
  {
    heading: { en: '2. How your data is stored', ko: '2. 저장 방식' },
    body: {
      en: 'Your records and photos are stored locally on your device by default. When you use Cloud backup, a copy is stored on Google Firebase under your own account and is readable only by you.',
      ko: '기록과 사진은 기본적으로 기기 내부에 저장됩니다. 클라우드 백업을 사용할 때만 Google Firebase에 본인 계정으로 저장되며, 본인만 열람할 수 있습니다.',
    },
  },
  {
    heading: { en: '3. Third-party services', ko: '3. 제3자 서비스' },
    body: {
      en: 'We use Google Firebase (authentication and optional cloud backup) and Google AdMob (ads). These providers process data under their own privacy policies.',
      ko: 'Google Firebase(인증 및 선택적 클라우드 백업)와 Google AdMob(광고)을 사용합니다. 각 제공자는 자체 개인정보처리방침에 따라 데이터를 처리합니다.',
    },
  },
  {
    heading: { en: '4. Deleting your data', ko: '4. 데이터 삭제' },
    body: {
      en: 'You can reset all local data in Settings, and logging out removes your session. Cloud backups are tied to your account. To delete your account or ask questions, contact us below.',
      ko: '설정에서 로컬 데이터를 초기화할 수 있고, 로그아웃하면 세션이 제거됩니다. 클라우드 백업은 계정에 연결됩니다. 계정 삭제나 문의는 아래 연락처로 요청해주세요.',
    },
  },
];

const TERMS: Section[] = [
  {
    heading: { en: '1. The service', ko: '1. 서비스' },
    body: {
      en: 'Logit is a personal app for logging your own activities and outings. It is provided as-is for personal use.',
      ko: 'Logit은 개인의 활동·나들이를 기록하는 앱입니다. 개인적 이용을 위해 있는 그대로 제공됩니다.',
    },
  },
  {
    heading: { en: '2. Your account', ko: '2. 계정' },
    body: {
      en: 'Provide accurate information and keep your password secure. You are responsible for activity under your account.',
      ko: '정확한 정보를 입력하고 비밀번호를 안전하게 관리해주세요. 계정에서 이뤄진 활동에 대한 책임은 사용자에게 있습니다.',
    },
  },
  {
    heading: { en: '3. Your content', ko: '3. 사용자 콘텐츠' },
    body: {
      en: 'The records and photos you add remain yours. The app processes them only to store and display them for you.',
      ko: '작성한 기록과 사진은 사용자 소유입니다. 앱은 이를 저장·표시하기 위해서만 처리합니다.',
    },
  },
  {
    heading: { en: '4. Ads and data loss', ko: '4. 광고·데이터 손실' },
    body: {
      en: 'The app is free and may show ads. Because data is stored on your device, we recommend regular backups; we are not liable for data lost through device changes or reinstalls.',
      ko: '앱은 무료이며 광고가 표시될 수 있습니다. 데이터가 기기에 저장되므로 정기적인 백업을 권장하며, 기기 변경·재설치로 인한 데이터 손실에 대해서는 책임지지 않습니다.',
    },
  },
];

export function LegalModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const renderDoc = (title: Msg, sections: Section[]) => (
    <View style={{ gap: 14 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{tr(title)}</Text>
      {sections.map((s) => (
        <View key={tr(s.heading)} style={{ gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{tr(s.heading)}</Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: c.text2 }}>{tr(s.body)}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <Screen edges={['top', 'bottom']} contentStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40, gap: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.5, color: c.text }}>
            {tr({ en: 'Terms & Privacy', ko: '약관 및 개인정보' })}
          </Text>
          <Pressable onPress={onClose} hitSlop={10} style={{ padding: 4 }}>
            <Glyph size={22} color={c.text2} strokeWidth={2}>
              <Path d="M6 6l12 12M18 6L6 18" />
            </Glyph>
          </Pressable>
        </View>

        <Text style={{ fontSize: 12, color: c.text3 }}>
          {tr({ en: 'Effective ', ko: '시행일 ' })}{EFFECTIVE}
        </Text>

        {renderDoc({ en: 'Privacy Policy', ko: '개인정보처리방침' }, PRIVACY)}
        {renderDoc({ en: 'Terms of Service', ko: '이용약관' }, TERMS)}

        <Text style={{ fontSize: 12, color: c.text3 }}>
          {tr({ en: 'Questions? ', ko: '문의 ' })}{CONTACT}
        </Text>
      </Screen>
    </Modal>
  );
}
