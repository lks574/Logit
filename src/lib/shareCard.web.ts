import type { RefObject } from 'react';
import type { View } from 'react-native';

// Web 스텁 — view-shot/sharing은 네이티브 전용. 웹 프리뷰에선 공유 버튼을 숨기므로 no-op.
export async function shareRecordCard(_ref: RefObject<View | null>): Promise<void> {}
