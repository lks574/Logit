import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { Icon } from '../../components/Glyph';
import { useStore } from '../../store/StoreContext';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { tr } from '../../i18n/i18n';

// 회원 프로필 편집. 이름(닉네임)은 로컬 + 계정(Firebase displayName) 양쪽에 저장.
// 이메일은 계정 식별자라 수정 불가(읽기전용). 아바타 이니셜은 이름 첫 글자에서 파생.
export default function ProfileEditScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { profile, updateProfile } = useStore();
  const { updateDisplayName } = useAuth();

  const [name, setName] = React.useState(profile.name);
  const [saving, setSaving] = React.useState(false);
  const email = profile.email;

  const initial = (name.trim()[0] ?? '?').toUpperCase();

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await updateDisplayName(trimmed); // 계정(Firebase displayName)에 반영
    } catch {
      // 계정 반영 실패해도 로컬은 저장(오프라인 등). 조용히 진행.
    }
    updateProfile({ name: trimmed }); // 로컬 프로필
    nav.goBack();
  };

  const editableCard = (label: string, value: string, onChangeText: (v: string) => void, placeholder: string) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{label}</Text>
      <View
        style={{
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 13,
          paddingVertical: 13,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.text3}
          autoCapitalize="sentences"
          style={{ fontSize: 15, color: c.text, padding: 0 }}
        />
      </View>
    </View>
  );

  // 읽기전용 카드 (이메일) — 수정 불가, 흐리게.
  const readonlyCard = (label: string, value: string) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{label}</Text>
      <View
        style={{
          backgroundColor: c.surfaceAlt,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 13,
          paddingVertical: 13,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 15, color: c.text3 }}>{value || '—'}</Text>
        <Text style={{ fontSize: 11, color: c.text3 }}>{tr({ en: 'Locked', ko: '변경 불가' })}</Text>
      </View>
    </View>
  );

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Header: 뒤로 / 프로필 / 저장 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={8}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: c.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon.chevronLeft size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{tr({ en: 'Profile', ko: '프로필' })}</Text>
        <Pressable
          onPress={onSave}
          hitSlop={8}
          style={{
            height: 30,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: c.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>{tr({ en: 'Save', ko: '저장' })}</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 2, gap: 20, paddingBottom: 24 }}>
        {/* 아바타 미리보기 (이름 이니셜) */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff' }}>{initial}</Text>
          </View>
        </View>

        {editableCard(tr({ en: 'Name', ko: '이름' }), name, setName, tr({ en: 'Name', ko: '이름' }))}
        {readonlyCard(tr({ en: 'Email', ko: '이메일' }), email)}
      </View>
    </Screen>
  );
}
