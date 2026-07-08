import type { Msg } from '../i18n/i18n';

// 개발/서비스 현황 — 사용자가 "이 앱 잘 돌아가고 있구나"를 한눈에 느끼게 하는 데이터.
// 큰 건(주요 업데이트) 단위로 묶어 진행률(%)과 예상 시점을 보여준다.
// 지금은 정적. 추후 Firebase Remote Config의 JSON 파라미터(같은 형태)로 교체 예정
// → 화면 코드는 그대로 두고 이 값의 출처만 remoteConfig.getValue()로 바꾸면 된다.
export type DevItem = {
  title: Msg;
  progress: number; // 0..100 (100이면 배포 완료)
  eta: Msg; // 예상 업데이트 시점
};

export type DevStatus = {
  operational: boolean; // 서비스 정상 여부
  updatedAt: string; // 마지막 업데이트 (YYYY-MM-DD)
  items: DevItem[]; // 큰 건(주요 업데이트), 우선순위순
};

export const DEV_STATUS: DevStatus = {
  operational: true,
  updatedAt: '2026-07-08',
  items: [
    { title: { en: 'Settings & My page revamp', ko: '설정 · 마이 화면 개편' }, progress: 90, eta: { en: 'Jul 2026', ko: '2026년 7월' } },
    { title: { en: 'Usage analytics', ko: '앱 사용성 분석' }, progress: 20, eta: { en: 'Aug 2026', ko: '2026년 8월' } },
    { title: { en: 'Health app sync', ko: '건강 앱 연동' }, progress: 0, eta: { en: 'Q4 2026', ko: '2026년 4분기' } },
  ],
};
