import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, withAlpha } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'disabled';

// Button — gallery §07. Primary(accent) / Secondary(surface+border) /
// Ghost(text) / Destructive(error tint) / Disabled(surface-alt + text3).
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  fullWidth,
  small,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  small?: boolean;
}) {
  const { c } = useTheme();
  const bg: Record<Variant, string> = {
    primary: c.accent,
    secondary: c.surface,
    ghost: 'transparent',
    destructive: withAlpha(c.error, 12),
    disabled: c.surfaceAlt,
  };
  const fg: Record<Variant, string> = {
    primary: '#fff',
    secondary: c.text,
    ghost: c.accent,
    destructive: c.error,
    disabled: c.text3,
  };
  const disabled = variant === 'disabled';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          backgroundColor: bg[variant],
          borderRadius: radius.md - 2,
          paddingVertical: small ? 9 : 11,
          paddingHorizontal: small ? 16 : 18,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: c.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: pressed && !disabled ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ color: fg[variant], fontSize: small ? 13 : 14, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

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
