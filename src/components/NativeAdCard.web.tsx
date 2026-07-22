import React from 'react';

// react-native-google-mobile-ads는 네이티브 전용이다. 홈은 플랫폼 공통 화면이므로
// 웹 프리뷰에서는 동일 export를 no-op으로 대체한다.
export function NativeAdCard(): React.ReactElement | null {
  return null;
}
