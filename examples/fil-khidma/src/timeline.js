// One timing file: the picture and the sound both read it.
export const FPS = 30;
export const DURATION = 36;

// scene windows (seconds)
export const S = {
  hook: [0, 3.5],
  global: [3.5, 8.05],
  local: [8.05, 11.85],
  telegram: [11.85, 16.25],
  khalis: [16.25, 20.25],
  streamers: [20.25, 23.8],
  gallery: [23.8, 27.9],
  profile: [27.9, 31.2],
  end: [31.2, 36]
};

// typing in the Telegram field
export const TYPE = { start: 12.75, step: 0.105, word: 'bn0mardev' };
export const TAP_TG = 14.05;
export const CHIP_TG = 14.4;
export const TAP_KH = 18.2;

// every sound has a visible cause at this time
export const CUES = [
  { t: 0.0, kind: 'boom', gain: 0.9 },
  { t: 0.0, kind: 'air', dur: 2.4, gain: 0.35 },
  { t: 0.22, kind: 'thud', gain: 0.75 },
  { t: 0.9, kind: 'thud', gain: 0.75 },
  { t: 1.58, kind: 'thud', gain: 0.8 },
  { t: 2.35, kind: 'hit', gain: 0.9 },
  { t: 3.12, kind: 'whoosh', dur: 0.75, gain: 0.8 },
  { t: 4.05, kind: 'swish', dur: 0.5, gain: 0.45 },
  ...[0, 1, 2, 3, 4, 5, 6].map(i => ({ t: 4.25 + i * 0.09, kind: 'card', gain: 0.4 })),
  { t: 6.1, kind: 'tap', gain: 0.55 },
  { t: 7.55, kind: 'whoosh', dur: 0.8, gain: 0.85 },
  ...[0, 1, 2].map(i => ({ t: 8.7 + i * 0.16, kind: 'card', gain: 0.5 })),
  { t: 10.25, kind: 'tap', gain: 0.55 },
  { t: 11.45, kind: 'whoosh', dur: 0.8, gain: 0.85 },
  ...Array.from({ length: 9 }, (_, i) => ({ t: TYPE.start + i * TYPE.step, kind: 'key', gain: 0.5 })),
  { t: TAP_TG, kind: 'tap', gain: 0.7 },
  { t: CHIP_TG, kind: 'tick', gain: 0.45 },
  { t: 15.85, kind: 'whoosh', dur: 0.8, gain: 0.85 },
  { t: 17.0, kind: 'tick', gain: 0.35 },
  { t: TAP_KH, kind: 'tap', gain: 0.7 },
  { t: 19.85, kind: 'whoosh', dur: 0.8, gain: 0.85 },
  { t: 21.0, kind: 'tick', gain: 0.35 },
  { t: 23.55, kind: 'swish', dur: 0.9, gain: 0.6 },
  ...[0, 1, 2, 3].map(i => ({ t: 24.05 + i * 0.13, kind: 'swish', dur: 0.45, gain: 0.32 })),
  { t: 27.35, kind: 'whoosh', dur: 0.8, gain: 0.85 },
  { t: 29.0, kind: 'tick', gain: 0.35 },
  { t: 30.9, kind: 'whoosh', dur: 0.9, gain: 0.9 },
  { t: 32.0, kind: 'hit', gain: 1.0 },
  { t: 32.0, kind: 'boom', gain: 0.6 },
  { t: 33.5, kind: 'tick', gain: 0.3 }
];
