import { IconName } from '../components/Glyph';
import { Msg, tr } from '../i18n/i18n';

// MatchForm 종목 레지스트리 + 필드 스키마.
// 설계: docs/superpowers/specs/2026-07-02-matchform-sport-schema-design.md
//
// 각 종목이 자신의 필드 목록(타입·개수 가변)을 데이터로 정의한다. MatchForm은
// 이 스키마에서 입력 UI를 생성하고, 값은 record.fields[field.key]로 저장한다.
// ⚠️ field.key(한글)는 저장 호환을 위해 그대로 보존한다 — 번역 금지.
//    표시는 label(Msg)/placeholder(Msg)를 tr()로 렌더한다.

export type SportFieldType = 'number' | 'text';

export type SportField = {
  key: string; // record.fields 키 (기존 라벨 보존 — 저장 id, 번역 금지)
  label: Msg; // UI 라벨
  type: SportFieldType;
  placeholder?: Msg;
};

export type Sport = {
  key: string;
  label: Msg;
  icon: IconName;
  team?: boolean; // 팀 종목 → 결과 승/무/패, 스코어 라벨 우리/상대
  meLabel: Msg;
  oppLabel: Msg;
  fields: SportField[]; // 종목별 핵심 기록 (숫자 슬롯 + 게임스코어 등)
};

const ZERO: Msg = { en: '0', ko: '0' };
const num = (key: string, label: Msg): SportField => ({ key, label, type: 'number', placeholder: ZERO });
const text = (key: string, label: Msg, placeholder: Msg): SportField => ({ key, label, type: 'text', placeholder });

const ME: Msg = { en: 'Me', ko: '나' };
const US: Msg = { en: 'Us', ko: '우리' };
const OPP: Msg = { en: 'Opponent', ko: '상대' };

export const SPORTS: Sport[] = [
  {
    key: 'badminton',
    label: { en: 'Badminton', ko: '배드민턴' },
    icon: 'badminton',
    meLabel: ME,
    oppLabel: OPP,
    fields: [
      text('게임스코어', { en: 'Game score', ko: '게임스코어' }, { en: 'e.g. 21-18 · 19-21 · 21-15', ko: '예: 21-18 · 19-21 · 21-15' }),
      num('최장 랠리', { en: 'Longest rally', ko: '최장 랠리' }),
      num('에이스', { en: 'Aces', ko: '에이스' }),
    ],
  },
  {
    key: 'tennis',
    label: { en: 'Tennis', ko: '테니스' },
    icon: 'tennis',
    meLabel: ME,
    oppLabel: OPP,
    fields: [
      text('게임스코어', { en: 'Game score', ko: '게임스코어' }, { en: 'e.g. 6-4 · 6-3', ko: '예: 6-4 · 6-3' }),
      num('에이스', { en: 'Aces', ko: '에이스' }),
      num('더블폴트', { en: 'Double faults', ko: '더블폴트' }),
    ],
  },
  {
    key: 'pingpong',
    label: { en: 'Table Tennis', ko: '탁구' },
    icon: 'pingpong',
    meLabel: ME,
    oppLabel: OPP,
    fields: [
      text('게임스코어', { en: 'Game score', ko: '게임스코어' }, { en: 'e.g. 11-8 · 9-11 · 11-6', ko: '예: 11-8 · 9-11 · 11-6' }),
      num('최장 랠리', { en: 'Longest rally', ko: '최장 랠리' }),
      num('서브 득점', { en: 'Service points', ko: '서브 득점' }),
    ],
  },
  {
    key: 'soccer',
    label: { en: 'Soccer', ko: '축구' },
    icon: 'soccer',
    team: true,
    meLabel: US,
    oppLabel: OPP,
    fields: [
      num('골', { en: 'Goals', ko: '골' }),
      num('어시스트', { en: 'Assists', ko: '어시스트' }),
      text('포지션', { en: 'Position', ko: '포지션' }, { en: 'e.g. Midfielder', ko: '예: 미드필더' }),
    ],
  },
  {
    key: 'baseball',
    label: { en: 'Baseball', ko: '야구' },
    icon: 'baseball',
    team: true,
    meLabel: US,
    oppLabel: OPP,
    fields: [
      num('안타', { en: 'Hits', ko: '안타' }),
      num('타점', { en: 'RBIs', ko: '타점' }),
      num('홈런', { en: 'Home runs', ko: '홈런' }),
    ],
  },
  {
    key: 'jiujitsu',
    label: { en: 'Jiu-jitsu', ko: '주짓수' },
    icon: 'jiujitsu',
    meLabel: ME,
    oppLabel: OPP,
    fields: [
      text('게임스코어', { en: 'Game score', ko: '게임스코어' }, { en: 'e.g. Advantage 2-1', ko: '예: 어드밴티지 2-1' }),
      num('서브미션', { en: 'Submissions', ko: '서브미션' }),
      num('스윕', { en: 'Sweeps', ko: '스윕' }),
    ],
  },
];

// 활동 이름 → 종목 key (진입 종목). 미매칭 시 첫 종목.
// ⚠️ key(한글)는 활동 id — 번역 금지.
export const ACTIVITY_TO_SPORT: Record<string, string> = {
  축구: 'soccer',
  야구: 'baseball',
  배드민턴: 'badminton',
  테니스: 'tennis',
  탁구: 'pingpong',
  주짓수: 'jiujitsu',
};

export function sportFor(key: string): Sport {
  return SPORTS.find((s) => s.key === key) ?? SPORTS[0];
}
