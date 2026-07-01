import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// FormHeader — modal record form header: 취소 / icon+title / 저장(template color).
// HTML 2.1 lines 311–315 (저장 uses the template color, not accent).
export function FormHeader({
  title,
  icon,
  color,
  soft,
  onCancel,
  onSave,
}: {
  title: string;
  icon: React.ReactNode;
  color: string; // template color for 저장 + icon tint
  soft: string; // template soft for icon bg
  onCancel?: () => void;
  onSave?: () => void;
}) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      }}
    >
      <Pressable onPress={onCancel ?? (() => nav.goBack())} hitSlop={8}>
        <Text style={{ color: c.text2, fontSize: 15 }}>취소</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{title}</Text>
      </View>
      <Pressable
        onPress={onSave ?? (() => nav.navigate('MainTabs'))}
        style={{ backgroundColor: color, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 9 }}
      >
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>저장</Text>
      </Pressable>
    </View>
  );
}
