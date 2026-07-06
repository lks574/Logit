import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { tr } from '../i18n/i18n';
import { Icon } from './Glyph';

// Field — labeled text input. required → accent 1.5px border. Gallery §07.
export function Field({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  large,
}: {
  label: string;
  required?: boolean;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  large?: boolean;
}) {
  const { c } = useTheme();
  const [focused, setFocused] = React.useState(false);
  const ref = React.useRef<TextInput>(null);
  const active = focused || required;
  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      style={{
        backgroundColor: c.bg,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? c.accent : c.border,
        borderRadius: 13,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ fontSize: 12, color: c.text2 }}>
        {label}
        {required ? <Text style={{ color: c.accent, fontWeight: '600' }}> · {tr({ en: 'Required', ko: '필수' })}</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.text3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          fontSize: large ? 17 : 14,
          fontWeight: large ? '700' : '400',
          color: c.text,
          marginTop: 3,
          padding: 0,
        }}
      />
    </Pressable>
  );
}

// DisclosureButton — "세부 입력" row with icon + subtitle + chevron. Gallery §07.
export function DisclosureButton({
  title,
  subtitle,
  icon,
  open,
  onPress,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  open?: boolean;
  onPress?: () => void;
  badge?: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 14,
        padding: 14,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            backgroundColor: c.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{title}</Text>
          {badge ? (
            <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: c.text3 }}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: 12, color: c.text3, marginTop: 3 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {open ? <Icon.chevronDown size={18} color={c.text3} /> : <Icon.chevronRight size={16} color={c.text3} />}
    </Pressable>
  );
}

// SettingsRow — disclosure or toggle row (settings screen).
export function SettingsRow({
  icon,
  label,
  value,
  right,
  onPress,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}
    >
      {icon}
      <Text style={{ flex: 1, fontSize: 14, color: c.text }}>{label}</Text>
      {value ? <Text style={{ fontSize: 13, color: c.text3 }}>{value}</Text> : null}
      {right ?? <Icon.chevronRight size={16} color={c.text3} />}
    </Pressable>
  );
}
