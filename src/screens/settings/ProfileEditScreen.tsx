import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { Icon } from '../../components/Glyph';
import { useStore } from '../../store/StoreContext';
import { useTheme } from '../../theme/ThemeContext';

// 회원 = 로컬 프로필 편집 (인증/백엔드 없음 — PROGRESS.md 결정).
// 이름/이메일만 로컬 저장, 아바타 이니셜은 이름 첫 글자에서 파생.
export default function ProfileEditScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { profile, updateProfile } = useStore();

  const [name, setName] = React.useState(profile.name);
  const [email, setEmail] = React.useState(profile.email);

  const initial = (name.trim()[0] ?? '?').toUpperCase();

  const onSave = () => {
    updateProfile({ name: name.trim(), email: email.trim() });
    nav.goBack();
  };

  const fieldCard = (
    label: string,
    value: string,
    onChangeText: (v: string) => void,
    placeholder: string,
    keyboardType?: 'default' | 'email-address',
  ) => (
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
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          style={{ fontSize: 15, color: c.text, padding: 0 }}
        />
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
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>프로필</Text>
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
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>저장</Text>
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

        {fieldCard('이름', name, setName, '이름')}
        {fieldCard('이메일', email, setEmail, 'name@example.com', 'email-address')}
      </View>
    </Screen>
  );
}
