import { StoreState } from './types';

// Initial data = the design mockup content, so a fresh install looks identical
// to Logit.dc.html. "Today" is pinned to 2026-06-30 (design reference date).
export const TODAY = '2026-06-30';

export const seed: StoreState = {
  records: [
    {
      id: 'r-running-0630',
      activity: '런닝',
      template: 'endurance',
      dateISO: '2026-06-30',
      timeLabel: '오후 6:30',
      meta: '한강공원 · 5.2km · 27′12″',
      rating: 4,
      companions: ['민지'],
      photos: [],
      memo: '노을이 좋았다. 마지막 1km 페이스 올림. 다음엔 7km 도전.',
      fields: { 거리: '5.2km', 시간: '27:12', 속도: '11.5km/h', 고도: '42m', 평균심박: '152bpm', 칼로리: '328kcal' },
      sync: 'synced',
    },
    {
      id: 'r-musical-0629',
      activity: '뮤지컬',
      template: 'spectate',
      dateISO: '2026-06-29',
      timeLabel: '어제',
      meta: '〈레미제라블〉 · 블루스퀘어',
      rating: 5,
      companions: [],
      photos: [],
      memo: '3차 관람',
      fields: { 작품: '레미제라블', 공연장: '블루스퀘어', 회차: '3차', 출연진: '장발장·민우혁 · 자베르·카이 · 판틴·조정은' },
      sync: 'synced',
    },
    {
      id: 'r-cycling-0628',
      activity: '자전거',
      template: 'endurance',
      dateISO: '2026-06-28',
      timeLabel: '토요일',
      meta: '남산 순환 · 7.2km · 32′40″',
      rating: 4,
      companions: [],
      photos: [],
      memo: '오르막 구간 페이스 유지',
      fields: { 거리: '7.2km', 시간: '32:40', 속도: '13.2km/h', 고도: '180m', 칼로리: '410kcal' },
      sync: 'synced',
    },
    {
      id: 'r-health-0626',
      activity: '헬스',
      template: 'setrep',
      dateISO: '2026-06-26',
      timeLabel: '목요일',
      meta: '가슴 · 총 볼륨 4,250kg',
      rating: 3,
      companions: [],
      photos: [],
      memo: '벤치프레스 신기록',
      fields: { 부위: '가슴', 총볼륨: '4,250kg', 운동시간: '52분' },
      sync: 'synced',
    },
    {
      id: 'r-running-0625',
      activity: '런닝',
      template: 'endurance',
      dateISO: '2026-06-25',
      timeLabel: '수요일',
      meta: '탄천 · 6.0km · 31′05″',
      rating: 4,
      companions: ['민지'],
      photos: [],
      memo: '가볍게 조깅',
      fields: { 거리: '6.0km', 시간: '31:05', 속도: '11.6km/h', 고도: '12m', 칼로리: '360kcal' },
      sync: 'synced',
    },
    // 과거 유산소 기록 — 월별 차트/평균 속도/최장 거리가 실데이터로 채워지도록.
    {
      id: 'r-running-0520', activity: '런닝', template: 'endurance', dateISO: '2026-05-20', timeLabel: '5월 20일',
      meta: '올림픽공원 · 12.4km · 1:01:35', rating: 5, photos: [], memo: '최장 거리 경신',
      fields: { 거리: '12.4km', 시간: '61:35', 속도: '12.1km/h', 고도: '95m', 칼로리: '820kcal' }, sync: 'synced',
    },
    {
      id: 'r-running-0508', activity: '런닝', template: 'endurance', dateISO: '2026-05-08', timeLabel: '5월 8일',
      meta: '한강공원 · 11.0km · 58′40″', rating: 4, photos: [], memo: '',
      fields: { 거리: '11.0km', 시간: '58:40', 속도: '11.3km/h', 고도: '30m', 칼로리: '700kcal' }, sync: 'synced',
    },
    {
      id: 'r-cycling-0412', activity: '자전거', template: 'endurance', dateISO: '2026-04-12', timeLabel: '4월 12일',
      meta: '남산 · 9.0km · 40′30″', rating: 4, photos: [], memo: '',
      fields: { 거리: '9.0km', 시간: '40:30', 속도: '13.3km/h', 고도: '210m', 칼로리: '480kcal' }, sync: 'synced',
    },
    {
      id: 'r-running-0322', activity: '런닝', template: 'endurance', dateISO: '2026-03-22', timeLabel: '3월 22일',
      meta: '탄천 · 15.0km · 1:22:30', rating: 5, photos: [], memo: '하프 준비',
      fields: { 거리: '15.0km', 시간: '82:30', 속도: '10.9km/h', 고도: '40m', 칼로리: '990kcal' }, sync: 'synced',
    },
    {
      id: 'r-running-0310', activity: '런닝', template: 'endurance', dateISO: '2026-03-10', timeLabel: '3월 10일',
      meta: '한강공원 · 10.0km · 56′40″', rating: 4, photos: [], memo: '',
      fields: { 거리: '10.0km', 시간: '56:40', 속도: '10.6km/h', 고도: '20m', 칼로리: '640kcal' }, sync: 'synced',
    },
    {
      id: 'r-running-0215', activity: '런닝', template: 'endurance', dateISO: '2026-02-15', timeLabel: '2월 15일',
      meta: '올림픽공원 · 8.0km · 46′00″', rating: 3, photos: [], memo: '',
      fields: { 거리: '8.0km', 시간: '46:00', 속도: '10.4km/h', 고도: '25m', 칼로리: '520kcal' }, sync: 'synced',
    },
    {
      id: 'r-play-0503', activity: '연극', template: 'spectate', dateISO: '2026-05-03', timeLabel: '5월 3일',
      meta: '〈고도를 기다리며〉 · 명동예술극장', rating: 4, photos: [], memo: '',
      fields: { 작품: '고도를 기다리며', 공연장: '명동예술극장', 회차: '1차', 출연진: '블라디미르·신구 · 에스트라공·박근형' }, sync: 'synced',
    },
  ],
  plans: [
    { id: 'p-health-0630', activity: '헬스', template: 'setrep', dateISO: '2026-06-30', timeLabel: '오후 8:00', place: '홈짐', reminder: true },
    { id: 'p-soccer-0702', activity: '축구', template: 'match', dateISO: '2026-07-02', timeLabel: '오후 3:00', place: '잠실 보조경기장', reminder: true },
    { id: 'p-concert-0703', activity: '콘서트', template: 'spectate', dateISO: '2026-07-03', timeLabel: '오후 7:30', place: '올림픽홀', memo: '아이유', reminder: true },
    { id: 'p-running-0705', activity: '런닝', template: 'endurance', dateISO: '2026-07-05', timeLabel: '오전 7:00', place: '한강공원', memo: '10km 목표', reminder: false },
  ],
  customActivities: [],
  profile: { name: '현우', email: 'hyunwoo@flitto.com', weightKg: 70 },
  onboardingComplete: false,
  preferredActivities: [],
};

// 신규 설치 초기 상태 — 빈 스토어. 프로덕션 새 유저는 이걸로 시작한다(seed 더미 미노출).
// seed(디자인 목업 데이터)는 개발(__DEV__)에서만 초기값으로 사용. 프로필은 로그인 시 계정에서 채움.
export const emptyState: StoreState = {
  records: [],
  plans: [],
  customActivities: [],
  profile: { name: '', email: '' },
  onboardingComplete: false,
  preferredActivities: [],
};
