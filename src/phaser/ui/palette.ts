export const Colors = {
  bg: 0x071016,
  panel: 0x0b1b24,
  panelDark: 0x061018,
  cyan: 0x8beaff,
  green: 0x8df7b0,
  amber: 0xf3ca72,
  red: 0xff6f86,
  violet: 0xb8a5ff,
  ink: 0xd8eef4,
  muted: 0x7f9ca8,
  line: 0x85c2d5,
} as const;

export const Fonts = {
  display: '"Share Tech Mono", monospace',
  body: '"Inter", "Segoe UI", sans-serif',
} as const;

export function textStyle(size: number, color = '#d8eef4', fontFamily = Fonts.display) {
  return {
    fontFamily,
    fontSize: `${size}px`,
    color,
  };
}
