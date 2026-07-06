import { tr } from '../i18n/i18n';

// 실제 현재 날짜/시각 유틸. 'YYYY-MM-DD' / '오전·오후 H:MM'.
export function nowDateISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function nowTimeLabel(): string {
  const d = new Date();
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── 로케일 인지 표시 헬퍼 ──────────────────────────────────
// 저장 포맷(요일/월 배열 인덱스, '오전/오후')은 언어 무관하게 유지하고, 표시할 때만 tr()로 번역한다.
const WD_KO = ['일', '월', '화', '수', '목', '금', '토'];
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_EN_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(iso: string) {
  const d = new Date(Date.parse(iso + 'T00:00:00Z'));
  return { mo: d.getUTCMonth(), day: d.getUTCDate(), dow: d.getUTCDay() };
}

// "수" / "Wed"
export function weekdayShort(iso: string): string {
  return tr({ en: WD_EN[parts(iso).dow], ko: WD_KO[parts(iso).dow] });
}
// "6월 30일" / "Jun 30"
export function monthDay(iso: string): string {
  const { mo, day } = parts(iso);
  return tr({ en: `${MON_EN[mo]} ${day}`, ko: `${mo + 1}월 ${day}일` });
}
// "6월 30일 (수)" / "Jun 30 (Wed)"
export function monthDayWeekday(iso: string): string {
  return `${monthDay(iso)} (${weekdayShort(iso)})`;
}
// 헤더용 "6월 30일 월요일" / "Monday, Jun 30"
export function longDate(iso: string): string {
  const { mo, day, dow } = parts(iso);
  return tr({ en: `${WD_EN_LONG[dow]}, ${MON_EN[mo]} ${day}`, ko: `${mo + 1}월 ${day}일 ${WD_KO[dow]}요일` });
}
// "7/2 (수)" / "7/2 (Wed)"
export function slashDayWeekday(iso: string): string {
  const { mo, day } = parts(iso);
  return `${mo + 1}/${day} (${weekdayShort(iso)})`;
}
// 저장된 '오전/오후 H:MM' → 현재 언어 표시 ("오전 9:00" / "9:00 AM")
export function displayTimeLabel(stored?: string): string {
  const m = stored?.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (!m) return stored ?? '';
  return tr({ en: `${m[2]}:${m[3]} ${m[1] === '오전' ? 'AM' : 'PM'}`, ko: `${m[1]} ${m[2]}:${m[3]}` });
}
