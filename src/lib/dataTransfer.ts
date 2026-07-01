import { Platform } from 'react-native';
import type { StoreState, StoredRecord } from '../store/types';

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

type Envelope = {
  app: string;
  version: number;
  exportedAt: string;
  data: StoreState;
};

// ── 직렬화 ──────────────────────────────────────────────────────────

export function buildJSON(state: StoreState): string {
  const env: Envelope = {
    app: APP,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(env, null, 2);
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
  const s = v === null || v === undefined ? '' : String(v);
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
    return `${filename} 다운로드를 시작했습니다.`;
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
      dialogTitle: 'Logit 데이터 내보내기',
    });
    return '내보내기를 완료했습니다.';
  }
  return `파일이 저장되었습니다:\n${file.uri}`;
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
    // 브라우저 file input은 취소 이벤트가 없다 → 취소 시 resolve되지 않음(상태 변경 없음, 허용).
    input.click();
  });
}

function normalize(parsed: any): StoreState {
  if (!parsed || parsed.app !== APP || typeof parsed.version !== 'number') {
    throw new Error('올바른 Logit 백업 파일이 아닙니다.');
  }
  if (parsed.version > VERSION) {
    throw new Error('더 새로운 버전의 백업 파일입니다. 앱을 업데이트해 주세요.');
  }
  const d = parsed.data;
  if (!d || !Array.isArray(d.records) || !Array.isArray(d.plans)) {
    throw new Error('백업 파일의 형식이 올바르지 않습니다.');
  }
  return {
    records: d.records,
    plans: d.plans,
    customActivities: Array.isArray(d.customActivities) ? d.customActivities : [],
    profile:
      d.profile && typeof d.profile === 'object'
        ? { name: String(d.profile.name ?? ''), email: String(d.profile.email ?? '') }
        : { name: '', email: '' },
  };
}

// 파일을 선택·파싱·검증해 StoreState를 반환. 취소 시 null. 잘못된 파일이면 throw.
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
    throw new Error('파일을 읽을 수 없습니다(JSON 파싱 실패).');
  }
  return normalize(parsed);
}
