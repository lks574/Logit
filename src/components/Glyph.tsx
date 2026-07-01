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
  // ---- Activity glyphs (template-colored) ----
  running: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="16" cy="4.5" r="2" />
      <Path d="M10 9l3-1.5 3 2 2 1.5M13 7.5l-1 5 3 2.5 1 4M12 12.5l-3.5 1.5L6 19" />
    </Glyph>
  ),
  dumbbell: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M6.5 6.5l11 11M4 8l-2 2 4 4M16 4l4 4-2 2M8 16l-4-4M16 8l4 4" />
    </Glyph>
  ),
  soccer: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z" />
    </Glyph>
  ),
  baseball: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M5 7c3 1.5 4.5 4 4.5 9M19 7c-3 1.5-4.5 4-4.5 9" />
    </Glyph>
  ),
  badminton: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M4 12h4l2-5 4 10 2-5h4" />
    </Glyph>
  ),
  tennis: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M4 8c5 1.5 11 1.5 16 0M4 16c5-1.5 11-1.5 16 0" />
    </Glyph>
  ),
  pingpong: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="9" cy="9" r="5" />
      <Path d="M13 13l6 6" />
    </Glyph>
  ),
  jiujitsu: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="6" r="3" />
      <Path d="M6 21v-1.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V21" />
    </Glyph>
  ),
  yoga: (p: IconProps) => (
    <Glyph {...p}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </Glyph>
  ),
  book: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M4 6h16v12H4z" />
      <Path d="M4 10h16" />
    </Glyph>
  ),
  performance: (p: IconProps) => (
    <Glyph {...p}>
      <Path d="M5 4h14v6a7 7 0 0 1-14 0z" />
      <Path d="M9 9h.01M15 9h.01M9 13c1 1.2 5 1.2 6 0" />
    </Glyph>
  ),
};

export type IconName = keyof typeof Icon;
