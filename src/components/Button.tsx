import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// Circular 38px icon button (gallery). tint overrides icon color region.
export function IconButton({
  children,
  onPress,
  size = 38,
  bg,
  style,
  label,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg ?? c.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

// Accent FAB 46x46, radius 16, floats -14 up (BottomTabBar center).
export function Fab({ children, onPress, label }: { children: React.ReactNode; onPress?: () => void; label?: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: c.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -14,
        shadowColor: c.accent,
        shadowOpacity: 0.5,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      {children}
    </Pressable>
  );
}
