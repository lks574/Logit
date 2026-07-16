// 클라이밍(setrep 템플릿 공유, 전용 폼) 데이터. 세션 = 루트/문제 목록.
// 헬스의 중량·세트 대신 그레이드·완등 여부·시도 수로 기록.
// 저장: fields.루트 = JSON([{ grade, sent, attempts }]), fields.스타일 = 볼더링/리드/톱로프.

export type ClimbRoute = { grade: string; sent: boolean; attempts: string };

export const CLIMB_STYLES = ['볼더링', '리드', '톱로프'] as const;
export const emptyRoute = (): ClimbRoute => ({ grade: '', sent: false, attempts: '' });

const toRoute = (r: any): ClimbRoute => ({
  grade: String(r?.grade ?? ''),
  sent: !!r?.sent,
  attempts: String(r?.attempts ?? ''),
});

export function parseRoutes(fields?: Record<string, string>): ClimbRoute[] {
  if (fields?.루트) {
    try {
      const arr = JSON.parse(fields.루트);
      if (Array.isArray(arr) && arr.length) return arr.map(toRoute);
    } catch {}
  }
  return [emptyRoute()];
}

// 저장 전 정리 — 그레이드 빈 루트 제거.
export function cleanRoutes(routes: ClimbRoute[]): ClimbRoute[] {
  return routes
    .map((r) => ({ grade: r.grade.trim(), sent: r.sent, attempts: r.attempts.trim() }))
    .filter((r) => r.grade !== '');
}

// 요약 — 완등 수 / 전체 루트 수. (그레이드는 V스케일·5.x 혼용이라 최고값 비교는 생략)
export function climbSummary(routes: ClimbRoute[]): { total: number; sent: number } {
  const cleaned = cleanRoutes(routes);
  return { total: cleaned.length, sent: cleaned.filter((r) => r.sent).length };
}
