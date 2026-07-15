import React from 'react';
import { Pressable, Text } from 'react-native';
import { Icon } from './Glyph';
import { activityLabel } from '../data/activities';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/tokens';
import { tr } from '../i18n/i18n';

// "최근 {활동} 기록 불러오기" 배너 — 신규 작성 폼 상단에서 직전 기록 프리필 진입점.
// 노출 조건(!editing && lastRecord)은 호출부에서 판단한다.
export function PrefillBanner({ activity, onPress }: { activity: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        width: '100%',
        backgroundColor: c.accentSoft,
        borderWidth: 1,
        borderColor: withAlpha(c.accent, 22),
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 13,
      }}
    >
      <Icon.refresh size={17} color={c.accent} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: c.accent }}>
        {tr({ en: `Load last ${activityLabel(activity)} record`, ko: `최근 ${activityLabel(activity)} 기록 불러오기` })}
      </Text>
      <Icon.chevronRight size={16} color={c.accent} strokeWidth={2} />
    </Pressable>
  );
}
