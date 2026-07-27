import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormHeader } from './FormHeader';
import { useTheme } from '../theme/ThemeContext';
import { tr } from '../i18n/i18n';

// FormShell — 기록 폼 공용 셸. 헤더 고정 · 본문만 스크롤 · 저장은 하단 안전영역에 고정.
//
// 이전 구조는 `<Screen>`(scroll 기본 true)이 FormHeader까지 한 ScrollView에 넣어서,
// 긴 폼(SetRep은 exercises[].sets[] 중첩 배열, Climbing은 routes[])에서 저장하려면
// 맨 위까지 되스크롤해야 했다. 저장은 모든 기록의 마지막 동작이라 매번 걸리는 마찰.
//
// 저장 버튼은 하단 하나만 둔다. 헤더를 고정하면 상단 저장도 항상 보이지만,
// 주 액션 버튼이 화면에 둘 보이는 게 더 혼란스럽다(헤더는 취소·제목만 유지).
export function FormShell({
  title,
  icon,
  color,
  soft,
  onCancel,
  onSave,
  saveLabel,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string; // 템플릿 색 — 저장 버튼 + 아이콘 틴트
  soft: string; // 템플릿 soft 색 — 아이콘 배경
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    // 하단은 SafeAreaView에 맡기지 않는다 — KeyboardAvoidingView의 padding이
    // safe-area 아래에 붙어 이중 여백이 생긴다. 대신 저장 바에서 insets.bottom을 직접 준다.
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <FormHeader title={title} icon={icon} color={color} soft={soft} onCancel={onCancel} hideSave />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* KAV가 컨테이너를 줄여 키보드와 겹치지 않으므로 automaticallyAdjustKeyboardInsets의
            추가 inset은 0이 된다(이중 보정 아님). 포커스된 입력 자동 스크롤은 그대로 유지. */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopWidth: 1,
            borderTopColor: c.border,
            backgroundColor: c.bg,
          }}
        >
          <Pressable
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel={saveLabel ?? tr({ en: 'Save', ko: '저장' })}
            style={({ pressed }) => ({
              backgroundColor: color,
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {saveLabel ?? tr({ en: 'Save', ko: '저장' })}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
