import { Platform } from 'react-native';
import type { StoreState, StoredRecord } from '../store/types';
import { tr } from '../i18n/i18n';

// 데이터 내보내기 / 가져오기 (수동 백업·기기 이전).
// 설계: docs/superpowers/specs/2026-07-01-data-export-import-design.md
//
// 이 모듈은 UI를 갖지 않는다(react-native-web의 Alert가 no-op이라 크로스플랫폼
// 안내를 여기서 못 한다). 데이터를 반환하거나 Error를 throw하고, 모든 선택/확인/
// 결과 UI는 호출측(SettingsScreen의 ActionSheet)이 담당한다.
//
// 네이티브 모듈(expo-file-system/sharing/document-picker)은 photos.ts와 동일하게
// 웹 분기 이후 지연 require로 접근한다(웹 번들·네이티브 모듈 부재 보호).

const APP = 'logit';
const VERSION = 1;

export type ExportFormat = 'json' | 'csv';

export type Envelope = {
  app: string;
  version: number;
  exportedAt: string;
  data: StoreState;
};

// ── 직렬화 ──────────────────────────────────────────────────────────

// 백업 봉투(파일·클라우드 공용). 클라우드는 이 객체를 그대로 Firestore에 저장한다.
export function buildEnvelope(state: StoreState): Envelope {
  return { app: APP, version: VERSION, exportedAt: new Date().toISOString(), data: state };
}

export function buildJSON(state: StoreState): string {
  return JSON.stringify(buildEnvelope(state), null, 2);
}

const CSV_CORE = [
  'dateISO',
  'timeLabel',
  'activity',
  'template',
  'rating',
  'meta',
  'memo',
  'companions',
  'photoCount',
] as const;

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  // CSV 수식 인젝션 방어: =,+,-,@ 로 시작하는 셀은 앞에 '를 붙여 Excel이 수식으로
  // 실행하지 못하게 한다.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// 기록 전용 CSV. plans/profile/customActivities는 제외 → CSV는 재가져오기 불가(열람용).
// 동적 열: 전체 기록 fields 키의 합집합(정렬). Excel 한글용 UTF-8 BOM은 호출측에서 부여.
export function buildCSV(records: StoredRecord[]): string {
  const fieldKeys = Array.from(
    new Set(records.flatMap((r) => Object.keys(r.fields ?? {}))),
  ).sort();
  const header = [...CSV_CORE, ...fieldKeys];
  const rows = records.map((r) => {
    const core = [
      r.dateISO,
      r.timeLabel,
      r.activity,
      r.template,
      r.rating ?? '',
      r.meta ?? '',
      r.memo ?? '',
      (r.companions ?? []).join(' · '),
      (r.photos ?? []).length,
    ];
    const fields = fieldKeys.map((k) => r.fields?.[k] ?? '');
    return [...core, ...fields].map(csvCell).join(',');
  });
  return [header.map(csvCell).join(','), ...rows].join('\n');
}

// ── 내보내기 ────────────────────────────────────────────────────────

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

function downloadWeb(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// 파일로 내보낸다. 웹=Blob 다운로드, 네이티브=cache에 write 후 공유 시트.
// 실패 시 throw. 반환값은 사용자에게 보여줄 성공 메시지.
export async function exportData(state: StoreState, format: ExportFormat): Promise<string> {
  const isJSON = format === 'json';
  // CSV엔 UTF-8 BOM을 앞에 붙여 Excel이 한글을 깨지 않게 한다.
  const content = isJSON ? buildJSON(state) : '\uFEFF' + buildCSV(state.records);
  const filename = `logit-backup-${stamp()}.${format}`;
  const mimeType = isJSON ? 'application/json' : 'text/csv';

  if (Platform.OS === 'web') {
    downloadWeb(content, filename, mimeType);
    return tr({ en: `Started downloading ${filename}.`, ko: `${filename} 다운로드를 시작했습니다.` });
  }

  const { File, Paths } = require('expo-file-system');
  const Sharing = require('expo-sharing');
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType,
      UTI: isJSON ? 'public.json' : 'public.comma-separated-values-text',
      dialogTitle: tr({ en: 'Export Logit data', ko: 'Logit 데이터 내보내기' }),
    });
    return tr({ en: 'Export complete.', ko: '내보내기를 완료했습니다.' });
  }
  return tr({ en: `File saved:\n${file.uri}`, ko: `파일이 저장되었습니다:\n${file.uri}` });
}

// ── 가져오기 (JSON 전용) ────────────────────────────────────────────

function pickFileWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(f);
    };
    // 취소 시 change가 안 fire되므로 표준 cancel 이벤트로 promise를 해제한다(미해제 방지).
    input.oncancel = () => resolve(null);
    input.click();
  });
}

const TEMPLATES = ['endurance', 'setrep', 'match', 'spectate', 'outing', 'free'];
const SYNC = ['synced', 'pending'];

const isStr = (v: unknown): v is string => typeof v === 'string';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isStrArr = (v: unknown): boolean => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isStrMap = (v: unknown): boolean =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v as object).every((x) => typeof x === 'string');
const badFormat = () => new Error(tr({ en: 'The backup file format is invalid.', ko: '백업 파일의 형식이 올바르지 않습니다.' }));

// 전체 교체(replaceAll)로 영구 저장하므로, 필수 필드뿐 아니라 optional 필드의 타입·형식도
// 검증한다(types.ts 기준). 하나라도 어긋나면 거부 — 손상 파일이 앱 상태를 덮어써
// 화면을 영구 크래시시키거나(잘못된 companions/fields) 레코드가 사라지는 것(잘못된 dateISO)을 막는다.
function validRecord(r: any): boolean {
  return (
    !!r &&
    isStr(r.id) &&
    isStr(r.activity) &&
    isStr(r.dateISO) &&
    DATE_RE.test(r.dateISO) &&
    isStr(r.timeLabel) &&
    TEMPLATES.includes(r.template) &&
    SYNC.includes(r.sync) &&
    (r.meta === undefined || isStr(r.meta)) &&
    (r.memo === undefined || isStr(r.memo)) &&
    (r.rating === undefined || typeof r.rating === 'number') &&
    (r.companions === undefined || isStrArr(r.companions)) &&
    (r.photos === undefined || isStrArr(r.photos)) &&
    (r.fields === undefined || isStrMap(r.fields))
  );
}
function validPlan(p: any): boolean {
  return (
    !!p &&
    isStr(p.id) &&
    isStr(p.activity) &&
    isStr(p.dateISO) &&
    DATE_RE.test(p.dateISO) &&
    (p.timeLabel === undefined || isStr(p.timeLabel)) &&
    TEMPLATES.includes(p.template) &&
    (p.place === undefined || isStr(p.place)) &&
    (p.memo === undefined || isStr(p.memo)) &&
    (p.reminder === undefined || typeof p.reminder === 'boolean') &&
    (p.done === undefined || typeof p.done === 'boolean')
  );
}

export function normalize(parsed: any): StoreState {
  if (!parsed || parsed.app !== APP || typeof parsed.version !== 'number') {
    throw new Error(tr({ en: 'This is not a valid Logit backup file.', ko: '올바른 Logit 백업 파일이 아닙니다.' }));
  }
  if (parsed.version > VERSION) {
    throw new Error(tr({ en: 'This backup is from a newer version. Please update the app.', ko: '더 새로운 버전의 백업 파일입니다. 앱을 업데이트해 주세요.' }));
  }
  const d = parsed.data;
  if (!d || !Array.isArray(d.records) || !Array.isArray(d.plans)) {
    throw badFormat();
  }
  if (!d.records.every(validRecord) || !d.plans.every(validPlan)) {
    throw badFormat();
  }
  // 중복 id 거부 — 이후 update/delete가 여러 항목을 동시에 건드리는 것을 막는다.
  const rIds = d.records.map((r: any) => r.id);
  const pIds = d.plans.map((p: any) => p.id);
  if (new Set(rIds).size !== rIds.length || new Set(pIds).size !== pIds.length) {
    throw badFormat();
  }
  return {
    // 가져온 기록은 이미 존재하는 데이터이므로 synced로 고정 — 'pending'으로 들어오면
    // 타이머가 없어 SyncStatusBadge가 영구히 "대기 중"에 걸린다.
    records: d.records.map((r: StoredRecord) => ({ ...r, sync: 'synced' as const })),
    plans: d.plans,
    customActivities: Array.isArray(d.customActivities) ? d.customActivities : [],
    profile:
      d.profile && typeof d.profile === 'object'
        ? {
            name: String(d.profile.name ?? ''),
            email: String(d.profile.email ?? ''),
            ...(Number.isFinite(Number(d.profile.weightKg)) && Number(d.profile.weightKg) > 0
              ? { weightKg: Number(d.profile.weightKg) }
              : {}),
          }
        : { name: '', email: '' },
    // 복원은 이미 사용 중인 앱에 들어오므로 온보딩을 다시 띄우지 않는다(누락 시 true).
    onboardingComplete: d.onboardingComplete ?? true,
    preferredActivities: Array.isArray(d.preferredActivities) ? d.preferredActivities : [],
  };
}

// 파일을 선택·파싱·검증해 StoreState를 반환. 취소 시 null. 잘못된 파일이면 throw.
// ponytail: 가져오기는 JSON(무손실 전체 백업) 전용. CSV 가져오기는 별도 경로 —
//   CSV 파서 + 헤더→fields 매핑 + records-only 부분복원 정책이 필요하다. 요청 시 추가.
export async function importData(): Promise<StoreState | null> {
  let text: string | null;
  if (Platform.OS === 'web') {
    text = await pickFileWeb();
  } else {
    const DocumentPicker = require('expo-document-picker');
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return null;
    const { File } = require('expo-file-system');
    text = await new File(res.assets[0].uri).text();
  }
  if (text === null) return null; // 취소

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(tr({ en: 'Could not read the file (JSON parse failed).', ko: '파일을 읽을 수 없습니다(JSON 파싱 실패).' }));
  }
  return normalize(parsed);
}
