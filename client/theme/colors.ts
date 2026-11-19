// "Tide" palette — neutral grays, ink primary actions, one deep-teal accent.
//
// Roles, not brands:
//   primary / onPrimary  — the main call-to-action fill (ink in light, near-white in dark)
//   accent / onAccent    — selection & state: active tab, selected chip/pin, links, focus
//   accentDim/accentGlow — tinted backgrounds/borders for selected things
//   cardBorder           — cards are borderless in light mode (surface contrast does
//                          the work) and get a faint edge in dark mode
// Keep accent rationed: if something isn't selected, focused or a link, it's neutral.

export const darkColors = {
  bg: '#0B0D0D',
  surface1: '#151817',
  surface2: '#1C201F',
  surface3: '#272C2B',
  border: 'rgba(255,255,255,0.06)',
  borderMed: 'rgba(255,255,255,0.11)',
  cardBorder: 'rgba(255,255,255,0.05)',
  primary: '#F1F3F2',
  onPrimary: '#0B0D0D',
  accent: '#2DB5A5',
  onAccent: '#04211D',
  accentDim: 'rgba(45,181,165,0.14)',
  accentGlow: 'rgba(45,181,165,0.32)',
  accentText: '#5ED1C2',
  text1: '#ECEFEE',
  text2: '#9AA19F',
  text3: '#5E6563',
  green: '#34C77A',
  greenDim: 'rgba(52,199,122,0.14)',
  yellow: '#F5C542',
  yellowDim: 'rgba(245,197,66,0.14)',
  red: '#F05A5A',
  redDim: 'rgba(240,90,90,0.12)',
  // Opaque chrome floating over the map (search pill, chips, FABs).
  glass: 'rgba(21,24,23,0.95)',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: '#000000',
};

export const lightColors = {
  bg: '#F3F3F0',
  surface1: '#FFFFFF',
  surface2: '#EDEDEA',
  surface3: '#E0E1DD',
  border: 'rgba(17,19,18,0.07)',
  borderMed: 'rgba(17,19,18,0.12)',
  cardBorder: 'transparent',
  primary: '#121413',
  onPrimary: '#FFFFFF',
  accent: '#0F766E',
  onAccent: '#FFFFFF',
  accentDim: 'rgba(15,118,110,0.09)',
  accentGlow: 'rgba(15,118,110,0.24)',
  accentText: '#0F766E',
  text1: '#121413',
  text2: '#5C615F',
  text3: '#9A9F9C',
  green: '#16A34A',
  greenDim: 'rgba(22,163,74,0.10)',
  yellow: '#E0A800',
  yellowDim: 'rgba(224,168,0,0.12)',
  red: '#DC2626',
  redDim: 'rgba(220,38,38,0.08)',
  glass: 'rgba(255,255,255,0.97)',
  overlay: 'rgba(10,12,11,0.40)',
  shadow: '#0B1A17',
};

export type Colors = typeof darkColors;
