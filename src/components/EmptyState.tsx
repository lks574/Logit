import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// EmptyState — dashed card, icon tile, title + subtitle + optional CTA. Gallery §07.
export function EmptyState({
  icon,
  title,
  subtitle,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        gap: 12,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: c.border,
        borderRadius: 14,
        paddingVertical: 24,
        paddingHorizontal: 18,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 15,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: c.text2, marginTop: 4, textAlign: 'center', lineHeight: 18 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {cta}
    </View>
  );
}
