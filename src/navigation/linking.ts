import type { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

// 딥링크(logit://) + 유니버설/앱링크(https://<도메인>) 공용 라우팅 맵.
// 세 링크 방식이 동일한 URL 경로를 공유한다 — 차이는 prefix와 네이티브 설정(app.json)·호스팅뿐.
// 유니버설/앱링크 도메인이 정해지면 prefixes에 'https://<도메인>'만 추가하면 된다.
//
// 예: logit://record/<recordId> · logit://plan/<planId> · logit://stats
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['logit://', 'https://logit-rn-54efa.web.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Calendar: 'calendar',
          Stats: 'stats',
          My: 'my',
        },
      },
      Detail: 'record/:recordId', // 활동은 기록에서 파생되므로 recordId만 필요
      AddPlan: 'plan/:planId',
      Plans: 'plans',
      CategoryStats: 'category/:category',
      Settings: 'settings',
      Feedback: 'feedback',
      Roadmap: 'roadmap',
    },
  },
};
