import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { tr } from '../i18n/i18n';

// FormHeader — modal record form header: 취소 / icon+title / 저장(template color).
// HTML 2.1 lines 311–315 (저장 uses the template color, not accent).
export function FormHeader({
  title,
  icon,
  color,
  soft,
  onCancel,
  onSave,
  hideSave,
}: {
  title: string;
  icon: React.ReactNode;
  color: string; // template color for 저장 + icon tint
  soft: string; // template soft for icon bg
  onCancel?: () => void;
  onSave?: () => void;
  hideSave?: boolean; // FormShell이 저장을 하단 고정 바로 옮겨 쓸 때 true
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
      {/* 좌/우를 flex:1로 두고 가운데를 auto로 — 저장을 숨겨도(FormShell) 제목이 중앙에 남는다. */}
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <Pressable
          onPress={onCancel ?? (() => nav.goBack())}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr({ en: 'Cancel', ko: '취소' })}
        >
          <Text style={{ color: c.text2, fontSize: 15 }}>{tr({ en: 'Cancel', ko: '취소' })}</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1, paddingHorizontal: 8 }}>
        <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
        <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{title}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {hideSave ? null : (
          <Pressable
            onPress={onSave ?? (() => nav.navigate('MainTabs'))}
            accessibilityRole="button"
            accessibilityLabel={tr({ en: 'Save', ko: '저장' })}
            style={{ backgroundColor: color, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 9 }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{tr({ en: 'Save', ko: '저장' })}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
