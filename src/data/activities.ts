import { Icon, IconName } from '../components/Glyph';
import { Palette, TemplateType, templateColor } from '../theme/tokens';
import { Msg, tr } from '../i18n/i18n';

// Activity registry — builtin activities mapped to a record template + icon.
// New activities (user-defined) just pick a template; forms/stats/calendar
// follow automatically (README §정보구조).
//
// ⚠️ 객체 key와 `name`은 저장/링크 id다(레코드가 이 값으로 활동을 참조). 번역 금지 —
// 표시는 `label: Msg`를 tr()로 렌더한다(activityLabel). 커스텀 활동은 label이 없어 이름 그대로.
export type Activity = {
  name: string;
  label: Msg;
  template: TemplateType;
  icon: IconName;
};

export const activities: Record<string, Activity> = {
  런닝: { name: '런닝', label: { en: 'Running', ko: '런닝' }, template: 'endurance', icon: 'running' },
  자전거: { name: '자전거', label: { en: 'Cycling', ko: '자전거' }, template: 'endurance', icon: 'bike' },
  수영: { name: '수영', label: { en: 'Swimming', ko: '수영' }, template: 'endurance', icon: 'swim' },
  헬스: { name: '헬스', label: { en: 'Gym', ko: '헬스' }, template: 'setrep', icon: 'dumbbell' },
  클라이밍: { name: '클라이밍', label: { en: 'Climbing', ko: '클라이밍' }, template: 'setrep', icon: 'climbing' },
  축구: { name: '축구', label: { en: 'Soccer', ko: '축구' }, template: 'match', icon: 'soccer' },
  야구: { name: '야구', label: { en: 'Baseball', ko: '야구' }, template: 'match', icon: 'baseball' },
  배드민턴: { name: '배드민턴', label: { en: 'Badminton', ko: '배드민턴' }, template: 'match', icon: 'badminton' },
  테니스: { name: '테니스', label: { en: 'Tennis', ko: '테니스' }, template: 'match', icon: 'tennis' },
  탁구: { name: '탁구', label: { en: 'Table Tennis', ko: '탁구' }, template: 'match', icon: 'pingpong' },
  주짓수: { name: '주짓수', label: { en: 'Jiu-jitsu', ko: '주짓수' }, template: 'match', icon: 'jiujitsu' },
  뮤지컬: { name: '뮤지컬', label: { en: 'Musical', ko: '뮤지컬' }, template: 'spectate', icon: 'musical' },
  연극: { name: '연극', label: { en: 'Play', ko: '연극' }, template: 'spectate', icon: 'performance' },
  콘서트: { name: '콘서트', label: { en: 'Concert', ko: '콘서트' }, template: 'spectate', icon: 'music' },
  요가: { name: '요가', label: { en: 'Yoga', ko: '요가' }, template: 'free', icon: 'yoga' },
  독서: { name: '독서', label: { en: 'Reading', ko: '독서' }, template: 'free', icon: 'book' },
  캠핑: { name: '캠핑', label: { en: 'Camping', ko: '캠핑' }, template: 'outing', icon: 'tent' },
  여행: { name: '여행', label: { en: 'Travel', ko: '여행' }, template: 'outing', icon: 'mappin' },
  맛집: { name: '맛집', label: { en: 'Dining', ko: '맛집' }, template: 'outing', icon: 'utensils' },
};

// 활동 표시명: 빌트인은 현재 언어로, 커스텀(사용자 입력)은 저장된 이름 그대로.
export function activityLabel(name: string): string {
  const a = activities[name];
  return a ? tr(a.label) : name;
}

// Resolve palette color keys for an activity's template.
export function colorsFor(template: TemplateType, c: Palette) {
  const { color, soft } = templateColor[template];
  return { color: c[color], soft: c[soft] };
}

export function iconFor(name: string) {
  return Icon[activities[name]?.icon ?? 'yoga'];
}
