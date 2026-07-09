import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { StoredPlan } from '../store/types';
import { tr } from '../i18n/i18n';

// 로컬 알림 — 약속 시작 1시간 전. plan.id를 알림 식별자로 써서 예약/취소가 idempotent.
// (원격 FCM/Expo push 토큰은 lib/push.ts. 권한/핸들러는 여기서 공용.)

const REMINDER_OFFSET_MS = 60 * 60 * 1000; // 1시간 전

// 포그라운드에서도 배너·목록·소리로 표시.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let asked = false;
export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: tr({ en: 'Reminders', ko: '약속 알림' }),
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && !asked) {
    asked = true; // 세션당 1회만 시스템 프롬프트(거부 후 반복 요청 방지)
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  return status === 'granted';
}

// dateISO(YYYY-MM-DD) + timeLabel("오후 8:00") → 로컬 트리거 시각(시작 1시간 전). 미설정/파싱실패 → null.
export function planTriggerDate(plan: StoredPlan): Date | null {
  if (!plan.reminder || !plan.timeLabel) return null;
  const m = plan.timeLabel.match(/(오전|오후)\s*(\d+):(\d+)/);
  if (!m) return null;
  let hour = parseInt(m[2], 10) % 12; // 12시 → 0
  if (m[1] === '오후') hour += 12; // 오후 → +12 (오후 12시=정오는 12 유지)
  const minute = parseInt(m[3], 10);
  const [y, mo, d] = plan.dateISO.split('-').map(Number);
  const start = new Date(y, mo - 1, d, hour, minute, 0, 0);
  return new Date(start.getTime() - REMINDER_OFFSET_MS);
}

// 약속 알림 재조정 — 기존 예약 취소 후, 유효하면(미래 시각) 다시 예약. 생성/수정 시 호출.
export async function syncPlanReminder(plan: StoredPlan): Promise<void> {
  await cancelPlanReminder(plan.id);
  const when = planTriggerDate(plan);
  if (!when || when.getTime() <= Date.now()) return; // 알림 꺼짐·시간 미정·이미 지난 시각
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: plan.id,
    content: {
      title: plan.activity,
      body: tr({ en: 'Starts in 1 hour.', ko: '1시간 뒤 시작해요.' }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
}

export async function cancelPlanReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
