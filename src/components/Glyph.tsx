import React from 'react';
import Svg, { Circle, Path, Rect, SvgProps } from 'react-native-svg';

// Stroke-style icon primitive (Lucide-ish), matching the inline SVGs in
// Logit.dc.html. Default viewBox 24x24, stroke = color, no fill.
// For one-off icons, inline the paths as children:
//   <Glyph size={18} color={c.accent}><Path d="..." /></Glyph>
export type GlyphProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  children: React.ReactNode;
  viewBox?: string;
} & Pick<SvgProps, 'width' | 'height'>;

export function Glyph({
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  viewBox = '0 0 24 24',
  width,
  height,
  children,
}: GlyphProps) {
  return (
    <Svg
      width={width ?? size}
      height={height ?? size}
      viewBox={viewBox}
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export { Path, Circle, Rect };

// ---- Named registry: icons shared across many screens ----
type IconProps = { size?: number; color?: string; strokeWidth?: number };

export const Icon = {
  logo: (p: IconProps) => (
    <Glyph {...p} strokeWidth={p.strokeWidth ?? 2.2}>
      <Path d="M4 19 L9 12 L13 15 L20 5" />
    </Glyph>
  ),
  plus: (p: IconProps) => (
    <Glyph {...p} strokeWidth={p.strokeWidth ?? 2.4}>
      <Path d="M12 5v14M5 12h14" />
    </Glyph>
  ),
  chevronRight: (p: IconProps) => (
    <Glyph {...p} strokeWidth={p.strokeWidth ?? 2.2}>
      <Path d="M9 6l6 6-6 6" />
    </Glyph>
  ),
  chevronLeft: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M15 6l-6 6 6 6" />
    </Glyph>
  ),
  chevronDown: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M6 9l6 6 6-6" />
    </Glyph>
  ),
  close: (p: IconProps) => (
    <Glyph {...p} strokeWidth={p.strokeWidth ?? 2.4}>
      <Path d="M6 6l12 12M18 6 6 18" />
    </Glyph>
  ),
  check: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M5 12.5 10 17l9-10" />
    </Glyph>
  ),
  search: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M21 21l-4-4" />
    </Glyph>
  ),
  home: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5" />
    </Glyph>
  ),
  calendar: (p: IconProps) => (
    <Glyph {...p}>
      <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </Glyph>
  ),
  chart: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Glyph>
  ),
  settings: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="12" r="3.2" />
      <Path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.3-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H7a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" />
    </Glyph>
  ),
  edit: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Glyph>
  ),
  user: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </Glyph>
  ),
  mail: (p: IconProps) => (
    <Glyph {...p}>
      <Rect x="3" y="5" width="18" height="14" rx="2.5" />
      <Path d="M4 7l8 6 8-6" />
    </Glyph>
  ),
  trash: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </Glyph>
  ),
  bell: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.5 21a1.7 1.7 0 0 1-3 0" />
    </Glyph>
  ),
  refresh: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M3 7v6h6M3 13a9 9 0 1 0 2.6-6.4L3 9" />
    </Glyph>
  ),
  share: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M12 3v13M8 7l4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </Glyph>
  ),
  // ---- Activity glyphs (template-colored) ----
  running: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="16" cy="4.5" r="2" />
      <Path d="M10 9l3-1.5 3 2 2 1.5M13 7.5l-1 5 3 2.5 1 4M12 12.5l-3.5 1.5L6 19" />
    </Glyph>
  ),
  dumbbell: (p: IconProps) => (
    // 정면 덤벨 — 손잡이 + 양쪽 원판 2겹.
    <Glyph {...p}>
      <Path d="M9 12h6M6 8.5v7M18 8.5v7M4 10.2v3.6M20 10.2v3.6" />
    </Glyph>
  ),
  bike: (p: IconProps) => (
    // 두 바퀴 + 프레임 + 안장·핸들바.
    <Glyph {...p}>
      <Circle cx="6" cy="16.5" r="3.3" />
      <Circle cx="18" cy="16.5" r="3.3" />
      <Path d="M6 16.5l4.5-7.5H15l3 7.5M8.5 9h3M14 9l1.5-2.5H18" />
    </Glyph>
  ),
  swim: (p: IconProps) => (
    // 머리 + 자유형 팔 스트로크 + 물결.
    <Glyph {...p}>
      <Circle cx="7" cy="7.5" r="1.8" />
      <Path d="M9 9l3.5 2 4-2.5" />
      <Path d="M3 16c2-1.6 3.5 1 5.5 0s3.5-1.6 5.5 0 3.5 1 5.5 0" />
    </Glyph>
  ),
  climbing: (p: IconProps) => (
    // 산 봉우리 + 정상 깃발 — 등반/정상 정복.
    <Glyph {...p}>
      <Path d="M3 20 9 9l3.2 5.5L14.5 10 21 20z" />
      <Path d="M9 9V4l3.2 1.2L9 6.4" />
    </Glyph>
  ),
  music: (p: IconProps) => (
    // 음표(콘서트) — 자루로 이은 두 음표 머리.
    <Glyph {...p}>
      <Circle cx="7" cy="18" r="2.4" />
      <Circle cx="17" cy="16" r="2.4" />
      <Path d="M9.4 18V6l10-2v12" />
    </Glyph>
  ),
  musical: (p: IconProps) => (
    // 무대 커튼(뮤지컬) — 봉 + 양쪽 드레이프. 연극(두 가면)과 차별.
    <Glyph {...p}>
      <Path d="M3 4h18" />
      <Path d="M6 4v11c0 2-1 3.4-3 4.5M6 4v15" />
      <Path d="M18 4v11c0 2 1 3.4 3 4.5M18 4v15" />
    </Glyph>
  ),
  soccer: (p: IconProps) => (
    // 축구공 — 중앙 오각형 + 5방향 이음새.
    <Glyph {...p}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7.4l3.8 2.8-1.5 4.6H9.7L8.2 10.2z" />
      <Path d="M12 3.1v4.3M4.5 8.8l3.7 1.4M19.5 8.8l-3.7 1.4M7.6 19.6l1.7-4.8M16.4 19.6l-1.7-4.8" />
    </Glyph>
  ),
  baseball: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M5 7c3 1.5 4.5 4 4.5 9M19 7c-3 1.5-4.5 4-4.5 9" />
    </Glyph>
  ),
  badminton: (p: IconProps) => (
    // 셔틀콕 — 코르크(아래 돔) + 위로 벌어지는 깃.
    <Glyph {...p}>
      <Path d="M9.5 16.2a2.5 2.5 0 0 0 5 0z" />
      <Path d="M9.9 16.1 6 7M12 15V6M14.1 16.1 18 7" />
      <Path d="M6 7q6-2.5 12 0" />
    </Glyph>
  ),
  tennis: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M4 8c5 1.5 11 1.5 16 0M4 16c5-1.5 11-1.5 16 0" />
    </Glyph>
  ),
  pingpong: (p: IconProps) => (
    // 탁구 라켓(블레이드+손잡이) + 공.
    <Glyph {...p}>
      <Circle cx="9.5" cy="9.5" r="5.5" />
      <Path d="M13.4 13.4 18.5 18.5" />
      <Circle cx="17.5" cy="6.5" r="1.4" />
    </Glyph>
  ),
  jiujitsu: (p: IconProps) => (
    // 무술 띠(오비) — 좌우 띠 + 가운데 다이아 매듭 + 늘어진 두 자락.
    <Glyph {...p}>
      <Path d="M2 10.5h7.7M14.3 10.5H22M2 13.5h7M15 13.5h7" />
      <Path d="M12 9 14.8 12 12 15 9.2 12z" />
      <Path d="M10.6 14.2 8.6 19.5M13.4 14.2 15.4 19.5" />
    </Glyph>
  ),
  yoga: (p: IconProps) => (
    // 연꽃 — 요가·명상의 상징. 가운데 꽃잎 + 좌우 꽃잎 + 받침.
    <Glyph {...p}>
      <Path d="M12 4c-1.6 2.4-1.6 5.6 0 8 1.6-2.4 1.6-5.6 0-8z" />
      <Path d="M12 12C9.6 9.7 6.2 9.2 3.6 10.7c1.2 3 4.4 3.8 8.4 1.3z" />
      <Path d="M12 12c2.4-2.3 5.8-2.8 8.4-1.3-1.2 3-4.4 3.8-8.4 1.3z" />
      <Path d="M4 14.6c1.7 2.6 4.7 4 8 4s6.3-1.4 8-4" />
    </Glyph>
  ),
  book: (p: IconProps) => (
    // 펼친 책 — 양쪽 페이지 + 가운데 책등.
    <Glyph {...p}>
      <Path d="M12 6.5C10 5 6.5 5 4 5.5v12.5c2.5-.5 6-.5 8 1 2-1.5 5.5-1.5 8-1V5.5c-2.5-.5-6-.5-8 1z" />
      <Path d="M12 6.5v13" />
    </Glyph>
  ),
  performance: (p: IconProps) => (
    // 희극·비극 두 가면 — 연극·공연의 상징.
    <Glyph {...p}>
      <Path d="M3 5h7v3.3a3.5 3.5 0 0 1-7 0z" />
      <Path d="M5 7h.01M8 7h.01M5.4 8.7c.9.7 1.3.7 2.2 0" />
      <Path d="M14 7.5h7v3.3a3.5 3.5 0 0 1-7 0z" />
      <Path d="M16 9.5h.01M19 9.5h.01M16.4 11.9c.9-.7 1.3-.7 2.2 0" />
    </Glyph>
  ),
  tent: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M12 4 3 20h18z" />
      <Path d="M12 4v16" />
    </Glyph>
  ),
  mappin: (p: IconProps) => (
    // 종이비행기 — 여행/떠남. (장소 핀과 겹치지 않게)
    <Glyph {...p}>
      <Path d="M21 3 2.5 9.6l7 3 3 7z" />
      <Path d="M21 3 9.5 12.6" />
    </Glyph>
  ),
  utensils: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M6 3v6a2 2 0 0 0 4 0V3M8 9v12" />
      <Path d="M16 3c-1.2 0-2 2-2 5s.8 4 2 4v9" />
    </Glyph>
  ),
};

export type IconName = keyof typeof Icon;
