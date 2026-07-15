import type { RefObject } from 'react';
import type { View } from 'react-native';
import { tr } from '../i18n/i18n';

// 공유 카드 캡처 → OS 공유 시트. ref는 오프스크린 ShareCard의 root View.
// 네이티브 모듈(view-shot/sharing)은 지연 require로 접근한다(웹 번들 보호는 shareCard.web.ts가 담당).
export async function shareRecordCard(ref: RefObject<View | null>): Promise<void> {
  if (!ref.current) return;
  const { captureRef } = require('react-native-view-shot');
  const Sharing = require('expo-sharing');

  // pixelRatio 3 → 340×425 뷰가 ~1020×1275 png로 캡처됨(SNS 공유에 충분).
  const uri: string = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', pixelRatio: 3 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: tr({ en: 'Share record', ko: '기록 공유' }),
    });
  }
}
