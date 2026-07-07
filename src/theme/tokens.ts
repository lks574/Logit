// Logit design tokens — 1:1 with Logit.dc.html (:root light / [data-theme=dark]).
// RN has no CSS variables or color-mix(); useTheme() resolves a palette and
// withAlpha() replaces color-mix(..., transparent).

export type Palette = {
  boardBg: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  accentSoft: string;
  cardio: string;
  cardioSoft: string;
  strength: string;
  strengthSoft: string;
  team: string;
  teamSoft: string;
  perf: string;
  perfSoft: string;
  outing: string;
  outingSoft: string;
  success: string;
  warning: string;
  error: string;
  star: string;
};

export const light: Palette = {
  boardBg: '#DBDEE4',
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F3',
  border: '#E2E5EA',
  text: '#1B1F24',
  text2: '#5B636E',
  text3: '#9AA1AB',
  accent: '#3D5A80',
  accentSoft: '#E5EBF2',
  cardio: '#2F8F83',
  cardioSoft: '#E0EFEC',
  strength: '#C2724B',
  strengthSoft: '#F4E7DF',
  team: '#4A6FA5',
  teamSoft: '#E4EAF3',
  perf: '#8A6BA8',
  perfSoft: '#EEE8F3',
  outing: '#5F8D4E',
  outingSoft: '#E6EEDF',
  success: '#3C9A6A',
  warning: '#C9962E',
  error: '#C2473D',
  star: '#E0A93B',
};

export const dark: Palette = {
  boardBg: '#0C0D0F',
  bg: '#15171A',
  surface: '#1E2126',
  surfaceAlt: '#262A30',
  border: '#2E333A',
  text: '#E8EAED',
  text2: '#A8B0BA',
  text3: '#6B7682',
  accent: '#6E8FBE',
  accentSoft: '#25303F',
  cardio: '#46AFA1',
  cardioSoft: '#1B2E2C',
  strength: '#D98C66',
  strengthSoft: '#33261F',
  team: '#6E91C7',
  teamSoft: '#1F2A38',
  perf: '#A98AC6',
  perfSoft: '#2A2335',
  outing: '#7BAE68',
  outingSoft: '#212A1D',
  success: '#4FB57E',
  warning: '#DFAE48',
  error: '#D75F54',
  star: '#ECB94F',
};

export const radius = { sm: 8, md: 14, lg: 20, xl: 28, card: 14 } as const;

// Template → color/soft key map (Record Templates).
export const templateColor: Record<
  TemplateType,
  { color: keyof Palette; soft: keyof Palette }
> = {
  endurance: { color: 'cardio', soft: 'cardioSoft' },
  setrep: { color: 'strength', soft: 'strengthSoft' },
  match: { color: 'team', soft: 'teamSoft' },
  spectate: { color: 'perf', soft: 'perfSoft' },
  free: { color: 'accent', soft: 'accentSoft' },
  outing: { color: 'outing', soft: 'outingSoft' },
};

export type TemplateType = 'endurance' | 'setrep' | 'match' | 'spectate' | 'free' | 'outing';

// color-mix(in srgb, <hex> N%, transparent) → rgba. hex must be #RRGGBB.
export function withAlpha(hex: string, pct: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${pct / 100})`;
}
