import React from 'react';
import {
  ScrollView,
  StyleProp,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

// Screen — real mobile screen (no phone-frame bezel/status-bar mock; those are
// document-only per README). SafeArea + bg, optional scroll.
export function Screen({
  children,
  scroll = true,
  bg,
  edges = ['top', 'bottom'],
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bg?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg ?? c.bg }}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

// Themed Text with sensible default color (text primary).
export function T(props: TextProps & { c?: string }) {
  const { c } = useTheme();
  const { style, c: colorOverride, ...rest } = props;
  return <Text {...rest} style={[{ color: colorOverride ?? c.text }, style]} />;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[{ height: 1, backgroundColor: c.border }, style]} />;
}

// Row helper.
export function Row({
  children,
  style,
  gap,
  between,
  center,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
  between?: boolean;
  center?: boolean;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: center ? 'center' : undefined,
          justifyContent: between ? 'space-between' : undefined,
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
