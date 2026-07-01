import { IconName } from '../components/Glyph';

// MatchForm 종목 레지스트리 + 필드 스키마.
// 설계: docs/superpowers/specs/2026-07-02-matchform-sport-schema-design.md
//
// 각 종목이 자신의 필드 목록(타입·개수 가변)을 데이터로 정의한다. MatchForm은
// 이 스키마에서 입력 UI를 생성하고, 값은 record.fields[field.key]로 저장한다.
// field.key는 저장 호환을 위해 기존 라벨을 그대로 보존한다.

export type SportFieldType = 'number' | 'text';

export type SportField = {
  key: string; // record.fields 키 (기존 라벨 보존)
  label: string; // UI 라벨 (기본은 key와 동일)
  type: SportFieldType;
  placeholder?: string;
};

export type Sport = {
  key: string;
  label: string;
  icon: IconName;
  team?: boolean; // 팀 종목 → 결과 승/무/패, 스코어 라벨 우리/상대
  meLabel: string;
  oppLabel: string;
  fields: SportField[]; // 종목별 핵심 기록 (숫자 슬롯 + 게임스코어 등)
};

const num = (key: string, placeholder = '0'): SportField => ({ key, label: key, type: 'number', placeholder });
const text = (key: string, placeholder: string): SportField => ({ key, label: key, type: 'text', placeholder });

export const SPORTS: Sport[] = [
  {
    key: 'badminton',
    label: '배드민턴',
    icon: 'badminton',
    meLabel: '나',
    oppLabel: '상대',
    fields: [text('게임스코어', '예: 21-18 · 19-21 · 21-15'), num('최장 랠리'), num('에이스')],
  },
  {
    key: 'tennis',
    label: '테니스',
    icon: 'tennis',
    meLabel: '나',
    oppLabel: '상대',
    fields: [text('게임스코어', '예: 6-4 · 6-3'), num('에이스'), num('더블폴트')],
  },
  {
    key: 'pingpong',
    label: '탁구',
    icon: 'pingpong',
    meLabel: '나',
    oppLabel: '상대',
    fields: [text('게임스코어', '예: 11-8 · 9-11 · 11-6'), num('최장 랠리'), num('서브 득점')],
  },
  {
    key: 'soccer',
    label: '축구',
    icon: 'soccer',
    team: true,
    meLabel: '우리',
    oppLabel: '상대',
    fields: [num('골'), num('어시스트'), text('포지션', '예: 미드필더')],
  },
  {
    key: 'baseball',
    label: '야구',
    icon: 'baseball',
    team: true,
    meLabel: '우리',
    oppLabel: '상대',
    fields: [num('안타'), num('타점'), num('홈런')],
  },
  {
    key: 'jiujitsu',
    label: '주짓수',
    icon: 'jiujitsu',
    meLabel: '나',
    oppLabel: '상대',
    fields: [text('게임스코어', '예: 어드밴티지 2-1'), num('서브미션'), num('스윕')],
  },
];

// 활동 이름 → 종목 key (진입 종목). 미매칭 시 첫 종목.
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
