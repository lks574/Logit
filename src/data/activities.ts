import { Icon, IconName } from '../components/Glyph';
import { Palette, TemplateType, templateColor } from '../theme/tokens';

// Activity registry — builtin activities mapped to a record template + icon.
// New activities (user-defined) just pick a template; forms/stats/calendar
// follow automatically (README §정보구조).
export type Activity = {
  name: string;
  template: TemplateType;
  icon: IconName;
};

export const activities: Record<string, Activity> = {
  런닝: { name: '런닝', template: 'endurance', icon: 'running' },
  자전거: { name: '자전거', template: 'endurance', icon: 'running' },
  헬스: { name: '헬스', template: 'setrep', icon: 'dumbbell' },
  클라이밍: { name: '클라이밍', template: 'setrep', icon: 'dumbbell' },
  축구: { name: '축구', template: 'match', icon: 'soccer' },
  야구: { name: '야구', template: 'match', icon: 'baseball' },
  배드민턴: { name: '배드민턴', template: 'match', icon: 'badminton' },
  테니스: { name: '테니스', template: 'match', icon: 'tennis' },
  탁구: { name: '탁구', template: 'match', icon: 'pingpong' },
  주짓수: { name: '주짓수', template: 'match', icon: 'jiujitsu' },
  뮤지컬: { name: '뮤지컬', template: 'spectate', icon: 'performance' },
  연극: { name: '연극', template: 'spectate', icon: 'performance' },
  콘서트: { name: '콘서트', template: 'spectate', icon: 'performance' },
  요가: { name: '요가', template: 'free', icon: 'yoga' },
  독서: { name: '독서', template: 'free', icon: 'book' },
};

// Resolve palette color keys for an activity's template.
export function colorsFor(template: TemplateType, c: Palette) {
  const { color, soft } = templateColor[template];
  return { color: c[color], soft: c[soft] };
}

export function iconFor(name: string) {
  return Icon[activities[name]?.icon ?? 'yoga'];
}
