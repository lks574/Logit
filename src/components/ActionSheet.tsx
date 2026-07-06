import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { tr } from '../i18n/i18n';

// 크로스플랫폼 하단 액션 시트. react-native-web의 Alert가 no-op이라, 선택/확인/결과
// 안내를 웹·네이티브 동일하게 처리하려고 RN Modal로 직접 구현한다.
// 제목 + (선택)메시지 + 액션 버튼 목록 + 취소.

export type SheetAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export function ActionSheet({
  visible,
  title,
  message,
  actions,
  cancelLabel,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  actions: SheetAction[];
  cancelLabel?: string;
  onCancel: () => void;
}) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
      >
        {/* 내부 탭이 배경으로 전파되어 닫히지 않도록 stopPropagation 대용 Pressable */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 28,
            gap: 12,
          }}
        >
          <View style={{ gap: 4, marginBottom: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, textAlign: 'center' }}>
              {title}
            </Text>
            {message ? (
              <Text style={{ fontSize: 13, color: c.text2, textAlign: 'center', lineHeight: 19 }}>
                {message}
              </Text>
            ) : null}
          </View>

          {actions.map((a, i) => (
            <Pressable
              key={`${a.label}-${i}`}
              onPress={a.onPress}
              style={{
                backgroundColor: a.destructive ? c.error : c.accent,
                borderRadius: radius.md,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{a.label}</Text>
            </Pressable>
          ))}

          <Pressable
            onPress={onCancel}
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: radius.md,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text2 }}>{cancelLabel ?? tr({ en: 'Cancel', ko: '취소' })}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
