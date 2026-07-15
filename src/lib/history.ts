import type { StoredRecord } from '../store/types';

// 과거 기록에서 특정 필드 값을 최근 사용순·중복 제거로 모아 추천용으로 반환.
// 장소(fields.장소)·공연장(fields.공연장) 등 자유 입력값의 재입력을 줄인다(하드코딩 목업 대체).
// records는 스토어 순서(최신순) 그대로 넘길 것. excludeId로 편집 중인 자기 자신 제외.
export function recentValues(
  records: StoredRecord[],
  key: string,
  opts: { limit?: number; excludeId?: string } = {},
): string[] {
  const { limit = 3, excludeId } = opts;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of records) {
    if (excludeId && r.id === excludeId) continue;
    const v = r.fields?.[key]?.trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
      if (out.length >= limit) break;
    }
  }
  return out;
}
