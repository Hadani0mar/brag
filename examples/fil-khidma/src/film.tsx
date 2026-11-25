import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Renderer } from '../vendor/center-stage-engine/renderer.js';
import { renderShot, TextCache } from '../vendor/center-stage-engine/shot.js';
import { Notification, Badge, Chip } from '../vendor/stageshow-kit/index';
import '../vendor/stageshow-kit/stageshow.css';
import { Grainient, toLab } from './grainient.js';
import { Screen, loadImages, tile, SW, SH, ease, easeIO, clamp } from './screens.js';
import { S, FPS, DURATION, TYPE, TAP_TG, CHIP_TG, TAP_KH } from './timeline.js';
import './film.css';

const W = 1080, H = 1920;
const HANDLE = '@bn0mardev';
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const easeOutBack = (t: number) => { t = clamp(t, 0, 1); return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2); };
const smooth = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const inS = (t: number, w: number[]) => t >= w[0] && t < w[1];

// ---------- keyframes: the main phone's pose ----------
type Key = { t: number; e?: 'io' | 'out' | 'whip' | 'in'; [k: string]: any };
const EASE: Record<string, (k: number) => number> = {
  io: easeIO,
  out: ease,
  in: (k: number) => k * k * k,
  whip: (k: number) => { k = clamp(k, 0, 1); return k < 0.5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2; }
};
function track(keys: Key[], t: number, p: string, dflt = 0) {
  const ks = keys.filter(k => k[p] !== undefined);
  if (!ks.length) return dflt;
  if (t <= ks[0].t) return ks[0][p];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i].t) {
      const a = ks[i - 1], b = ks[i];
      const k = (EASE[b.e || 'io'])((t - a.t) / (b.t - a.t));
      return lerp(a[p], b[p], k);
    }
  }
  return ks[ks.length - 1][p];
}

// spin is in degrees around the phone's own vertical axis; 0 faces the camera
const POSE: Key[] = [
  { t: 0, spin: 205, tilt: 14, roll: -10, y: -0.25, s: 0.86, zoom: 0.92, camY: -0.12, orbit: 0 },
  { t: 2.35, e: 'out', spin: 346, tilt: 5, roll: -2, y: 0, s: 1, zoom: 0.98, camY: -0.115 },
  { t: 3.12, spin: 342, tilt: 4, roll: -1 },
  { t: 3.88, e: 'whip', spin: 342 + 360 + 10, tilt: 6, roll: 2, x: 0, zoom: 0.9 },
  { t: 7.55, spin: 712 + 8, tilt: 3, roll: 1, zoom: 0.94, x: 0 },
  { t: 8.32, e: 'whip', spin: 1080 + 20, tilt: 5, roll: -2, x: -0.16, zoom: 0.95 },
  { t: 11.45, spin: 1080 + 14, tilt: 3, roll: -1, x: -0.16, zoom: 0.96, camY: -0.115 },
  // Telegram: a flip over the top, then the camera comes close to the field
  { t: 12.2, e: 'whip', spin: 1080, tilt: 360, roll: 0, x: 0, zoom: 1.0, camY: -0.115 },
  { t: 12.65, e: 'out', zoom: 1.42, camY: -0.075, tilt: 362, spin: 1080 - 6 },
  { t: 14.6, zoom: 1.48, camY: -0.08, tilt: 361, spin: 1080 - 4 },
  { t: 15.4, e: 'io', zoom: 0.98, camY: -0.115, tilt: 362, spin: 1080 - 10 },
  { t: 15.85, spin: 1080 - 12, tilt: 362, roll: 0 },
  { t: 16.6, e: 'whip', spin: 1440 + 12, tilt: 360 + 4, roll: -2 },
  { t: 19.85, spin: 1440 + 6, tilt: 363, roll: 2, zoom: 1.0 },
  // a barrel roll into the streamers
  { t: 20.6, e: 'whip', spin: 1800 - 8, tilt: 363, roll: 2, zoom: 0.95 },
  { t: 23.55, spin: 1800 - 4, roll: 0, zoom: 0.95, camY: -0.115 },
  { t: 24.6, e: 'io', spin: 1800, zoom: 0.6, camY: -0.05 },
  { t: 27.2, spin: 1800, zoom: 0.64, camY: -0.05 },
  { t: 27.95, e: 'whip', spin: 2160 - 14, zoom: 0.97, camY: -0.115, roll: 0 },
  { t: 30.9, spin: 2160 - 8, tilt: 363, roll: -1, zoom: 1.0, y: 0 },
  // the end: the phone turns its orange back and sinks away
  { t: 31.9, e: 'io', spin: 2160 + 160, tilt: 370, roll: -12, y: -0.25, zoom: 0.9 },
  { t: 33.0, e: 'in', y: -2.6, spin: 2160 + 200 }
];

// colour worlds for the background (React Bits Grainient)
const PAL: Record<string, string[]> = {
  night: ['#0b0706', '#2a0f0a', '#7a2a0e', '#f26430', '#ffb88f'],
  orange: ['#3a1206', '#b8401a', '#f26430', '#ff9a62', '#ffe1cc'],
  tg: ['#13213f', '#2a6fd6', '#7fb7ff', '#f6835a', '#ffe3d2'],
  khalis: ['#1f0a2e', '#5a1673', '#7d1e8f', '#c13fbf', '#ffd200'],
  live: ['#07070a', '#16121c', '#3a1a12', '#c2441a', '#ff8a52'],
  end: ['#3a1206', '#c24a1c', '#f26430', '#ff9a62', '#ffe7d6']
};
const LAB: Record<string, number[][]> = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map(toLab)]));
const PAL_KEYS: [number, string][] = [
  [0, 'night'], [2.2, 'orange'], [11.9, 'orange'], [12.5, 'tg'], [16.2, 'tg'], [16.7, 'khalis'], [20.15, 'khalis'], [20.7, 'live'],
  [23.6, 'live'], [24.4, 'orange'], [31.4, 'orange'], [32.2, 'end']
];
function ramp(t: number) {
  let a = PAL_KEYS[0], b = PAL_KEYS[0];
  for (let i = 0; i < PAL_KEYS.length; i++) { if (PAL_KEYS[i][0] <= t) { a = PAL_KEYS[i]; b = PAL_KEYS[i + 1] || a; } }
  const k = b === a ? 0 : smooth((t - a[0]) / (b[0] - a[0]));
  return LAB[a[1]].map((l, i) => l.map((v, j) => lerp(v, LAB[b[1]][i][j], k)));
}

// which screen the main phone shows, swapped while its back faces us
function mainScreen(t: number) {
  if (t < 3.5) return 'splash';
  if (t < 8.05) return 'global';
  if (t < 11.85) return 'local';
  if (t < 16.25) return 'telegram';
  if (t < 20.25) return 'khalis';
  if (t < 27.6) return 'streamers';
  return 'profile';
}

function screenState(name: string, t: number) {
  switch (name) {
    case 'splash': return { splash: span(t, 1.9, 2.6) };
    case 'global': {
      const f = (a: number) => smooth(span(t, a, a + 0.25)) * (1 - smooth(span(t, a + 0.9, a + 1.15)));
      return { rows: [[969, f(5.0)], [1422, f(5.6)]], tap: span(t, 6.1, 6.7), tapY: 969 };
    }
    case 'local': {
      const f = (a: number) => smooth(span(t, a, a + 0.25)) * (1 - smooth(span(t, a + 0.75, a + 1.0)));
      return { rows: [[515, f(9.0)], [667, f(9.6)], [818, f(10.2)]], tap: span(t, 10.25, 10.85), tapY: 818 };
    }
    case 'telegram': {
      const typed = clamp(Math.floor((t - TYPE.start) / TYPE.step) + 1, 0, 9);
      return { typed: t < TYPE.start ? 0 : typed, caret: t > 12.4 && t < TAP_TG ? 1 : 0, press: span(t, TAP_TG, TAP_TG + 0.35), chip: span(t, CHIP_TG, CHIP_TG + 0.35), tap: span(t, TAP_TG - 0.05, TAP_TG + 0.6) };
    }
    case 'khalis': return { press: span(t, TAP_KH, TAP_KH + 0.5), tap: span(t, TAP_KH - 0.05, TAP_KH + 0.65) };
    default: return {};
  }
}

// ---------- the 3D stage ----------
const GLOBAL_TILES = [515, 667, 818, 969, 1271, 1422, 1876]; // chat apps, Canva, Fortnite, Netflix, TikTok, PUBG, New State
const LOCAL_TILES = [515, 667, 818]; // Libyana, Al Madar, LTT
const GALLERY = ['global', 'local', 'telegram', 'khalis', 'profile'];
const ZB = Number(new URLSearchParams(location.search).get('zb') || 0.76);
const CY = Number(new URLSearchParams(location.search).get('cy') || -0.06);
const PHONE_H = 1.553, PHONE_W = 0.744;

function iconPos(cy: number) { // where a list row's icon sits on the phone, in phone space
  const u = (799 * 1.2) / 1080, v = ((cy * 1.2 - 100) * (SW / 1080)) / SH;
  return { x: (u - 0.5) * PHONE_W * 0.93, y: (0.5 - v) * PHONE_H * 0.86 - 0.04 };
}

function buildDoc(t: number) {
  const pose = (p: string, d = 0) => track(POSE, t, p, d);
  const ph = { spin: pose('spin'), tilt: pose('tilt'), roll: pose('roll'), x: pose('x'), y: pose('y'), s: pose('s', 1) };
  const bob = Math.sin(t * 1.3) * 0.018, sway = Math.sin(t * 0.7) * 2.2;
  const devices: any[] = [{ type: 'phone', finish: 'orange', slot: 0, glass: 0.55 }];
  const each: any[] = [{ spin: ph.spin + sway, tilt: ph.tilt + Math.sin(t * 0.9) * 1.2, roll: ph.roll, x: ph.x, y: ph.y + bob, scale: ph.s }];

  // floating 3D tiles: global cards
  const tiles = (list: number[], from: number, to: number, slot0: number, layout: (i: number, n: number, tt: number) => any) => {
    if (t < from - 0.01 || t > to + 0.6) return;
    list.forEach((cy, i) => {
      const out = easeOutBack(span(t, from + i * 0.09, from + 0.75 + i * 0.09));
      const back = easeIO(span(t, to, to + 0.45));
      const k = out * (1 - back);
      const src = iconPos(cy);
      const dst = layout(i, list.length, t);
      devices.push({ type: 'card', finish: 'clean', radius: 0.24, viewport: '1:1', slot: slot0 + i, scale: 0.085 });
      each.push({
        x: lerp(src.x + ph.x, dst.x, k), y: lerp(src.y, dst.y, k), z: lerp(0.05, dst.z, k),
        spin: lerp(ph.spin, dst.spin, k), tilt: lerp(0, dst.tilt, k), roll: lerp(0, dst.roll, k),
        scale: lerp(0.35, 1, k), opacity: clamp(k * 3, 0, 1)
      });
    });
  };
  tiles(GLOBAL_TILES, 4.15, 7.45, 6, (i, n, tt) => {
    const a = (i / n) * Math.PI * 2 + tt * 0.45 + 0.4;
    const side = Math.sin(a) >= 0 ? 1 : -1;
    return { x: side * (0.56 + Math.abs(Math.sin(a)) * 0.12), y: -0.62 + ((i * 0.37) % 1.3) + Math.sin(tt * 0.9 + i) * 0.04, z: Math.cos(a) * 0.22, spin: -18 + Math.sin(a) * 25, tilt: 8, roll: Math.sin(a + i) * 10 };
  });
  tiles(LOCAL_TILES, 8.6, 11.3, 13, (i, n, tt) => {
    const yy = 0.62 - i * 0.6;
    return { x: 0.55 + Math.sin(tt * 0.8 + i) * 0.03, y: yy + Math.sin(tt * 1.1 + i * 1.7) * 0.03, z: 0.15, spin: -24, tilt: 4, roll: -4 + i * 3 };
  });

  // gallery: five more phones arrive around the main one
  if (t > S.gallery[0] - 0.1 && t < S.gallery[1] + 0.2) {
    GALLERY.forEach((_, j) => {
      const side = j < 2 ? -(2 - j) : j - 1; // -2,-1,1,2,3
      const slotIdx = [-2, -1, 1, 2, 3][j];
      const inK = ease(span(t, 23.95 + j * 0.11, 24.85 + j * 0.11));
      const outK = easeIO(span(t, 27.05 + j * 0.05, 27.6 + j * 0.05));
      const k = inK * (1 - outK);
      const drift = Math.sin(t * 0.5) * 0.08 + (t - 24) * -0.05;
      const pos = slotIdx + drift;
      const ang = pos * 0.5;
      devices.push({ type: 'phone', finish: ['silver', 'natural', 'blue', 'black', 'glacier'][j], slot: 1 + j });
      each.push({
        x: Math.sin(ang) * 2.1 * k + (1 - k) * side * 0.2, z: (Math.cos(ang) - 1) * 1.6 * k - (1 - k) * 3,
        y: (1 - k) * 0.6, spin: -ang * 57.3 * 0.85 + (1 - k) * 90 + 2160 * 0, tilt: 0, roll: 0, opacity: clamp(k * 2, 0, 1)
      });
    });
    // the main phone joins the arc
    const k = ease(span(t, 23.95, 24.85)) * (1 - easeIO(span(t, 27.05, 27.6)));
    const drift = Math.sin(t * 0.5) * 0.08 + (t - 24) * -0.05;
    each[0].x += Math.sin(drift * 0.5) * 2.1 * k; each[0].z = (Math.cos(drift * 0.5) - 1) * 1.6 * k;
  }

  const doc: any = {
    aspect: '9:16',
    devices,
    camera: { rx: 4, ry: 0, fov: 26, pad: 0.1, zoom: pose('zoom', 1) * ZB, x: 0, y: pose('camY') + CY },
    background: { kind: 'image' },
    light: { shadow: 0.62, softness: 0.7, height: 62, angle: -22, glare: 0.06, distance: 0.2 },
    finish: { grain: 0.0, vignette: 0.22 },
    motion: { kind: 'script', fn: () => ({ each: (i: number) => each[i] }) }
  };
  return doc;
}

// ---------- React Bits text effects, driven by the film clock ----------
// BlurText: words arrive one by one out of a blur
function BlurText({ text, t, at, step = 0.09, dur = 0.5, className = '', out }: any) {
  const words = text.split(' ');
  const o = out !== undefined ? 1 - easeIO(span(t, out, out + 0.35)) : 1;
  return (
    <span className={`blurtext ${className}`}>
      {words.map((w: string, i: number) => {
        const k = ease(span(t, at + i * step, at + i * step + dur));
        return <span key={i} style={{ opacity: k * o, filter: `blur(${(1 - k) * 14 + (1 - o) * 10}px)`, transform: `translateY(${(1 - k) * 46 - (1 - o) * 30}px)` }}>{w}{i < words.length - 1 ? ' ' : ''}</span>;
      })}
    </span>
  );
}
// RotatingText: one word replaces the last with a vertical roll
function RotatingText({ words, t, at, every, className = '' }: any) {
  const raw = (t - at) / every;
  const idx = Math.max(0, Math.floor(raw));
  const ph = raw - idx;
  const k = idx === 0 ? ease(span(t, at, at + 0.4)) : easeIO(clamp(ph / 0.3, 0, 1));
  const cur = words[idx % words.length], prev = words[(idx - 1 + words.length) % words.length];
  return (
    <span className={`rotating ${className}`}>
      {idx > 0 && k < 1 && <span className="rot-word" style={{ transform: `translateY(${-k * 110}%)`, opacity: 1 - k }}>{prev}</span>}
      <span className="rot-word" style={{ transform: `translateY(${(1 - k) * 110}%)`, opacity: k }}>{cur}</span>
    </span>
  );
}
// ShinyText: a light that sweeps across the letters
function ShinyText({ text, t, speed = 2.2, className = '' }: any) {
  const p = ((t / speed) % 1) * 200 - 50;
  return <span className={`shiny ${className}`} style={{ backgroundPosition: `${100 - p}% 0` }}>{text}</span>;
}
// DecryptedText (Latin only): characters settle from noise into the handle
function Decrypted({ text, t, at, dur = 0.9 }: any) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789@_';
  const k = span(t, at, at + dur);
  return <span className="decrypt">{text.split('').map((c: string, i: number) => {
    const settled = k * text.length * 1.15 > i;
    const r = chars[Math.floor((Math.sin((i + 1) * 91.7 + Math.floor(t * 24) * 13.3) * 0.5 + 0.5) * chars.length) % chars.length];
    return <span key={i} style={{ opacity: k > 0 ? 1 : 0, color: settled ? undefined : 'rgba(255,255,255,0.55)' }}>{settled ? c : r}</span>;
  })}</span>;
}
// CountUp
function CountUp({ to, t, at, dur = 1.1 }: any) { return <span className="count">{Math.round(to * ease(span(t, at, at + dur)))}</span>; }

function Title({ t, win, kicker, title, sub, rot, glass }: any) {
  const [a, b] = win;
  if (t < a - 0.05 || t > b + 0.1) return null;
  const outAt = b - 0.42;
  return (
    <div className={`title${glass ? ' glass' : ''}`}>
      {kicker && <div className="kicker" style={{ opacity: ease(span(t, a + 0.15, a + 0.5)) * (1 - easeIO(span(t, outAt, outAt + 0.3))) }}>{kicker}</div>}
      <h1><BlurText text={title} t={t} at={a + 0.25} out={outAt} /></h1>
      {sub && <div className="sub"><BlurText text={sub} t={t} at={a + 0.55} step={0.05} out={outAt} /></div>}
      {rot && <div className="rot" style={{ opacity: ease(span(t, rot.at, rot.at + 0.3)) * (1 - easeIO(span(t, outAt, outAt + 0.3))) }}><RotatingText words={rot.words} t={t} at={rot.at} every={rot.every} /></div>}
    </div>
  );
}

// a stageshow part held at native size and scaled into the frame, moved by the film clock
function Sat({ children, x, y, k, scale = 2.3, from = 40, rot = 0 }: any) {
  if (k <= 0.001) return null;
  return (
    <div className="sat ss-stage" data-theme="light" style={{ left: x, top: y, opacity: clamp(k * 1.4, 0, 1), transform: `translate(-50%,-50%) translateY(${(1 - k) * from}px) rotate(${rot * (1 - k)}deg) scale(${scale * (0.85 + 0.15 * k)})` }}>
      {children}
    </div>
  );
}

function Overlay({ t }: { t: number }) {
  const hookWords = ['رصيد؟', 'كروت؟', 'كهرباء؟'];
  const hw = (i: number) => {
    const a = 0.2 + i * 0.68, b = a + 0.68;
    if (t < a || t > b + 0.05) return null;
    const k = ease(span(t, a, a + 0.22)), o = 1 - easeIO(span(t, b - 0.18, b));
    return <div key={i} className="hook-word" style={{ opacity: k * o, filter: `blur(${(1 - k) * 18 + (1 - o) * 12}px)`, transform: `scale(${1.5 - 0.5 * k + (1 - o) * 0.15})` }}>{hookWords[i]}</div>;
  };
  const endK = ease(span(t, 31.95, 32.6));
  const handleSmall = 1 - easeIO(span(t, 31.6, 32.0));
  return (
    <div className="overlay" dir="rtl">
      {/* hook */}
      {t < 2.3 && <div className="hook">{[0, 1, 2].map(hw)}</div>}
      {t >= 2.2 && t < 3.5 && (
        <div className="title">
          <h1 className="big"><BlurText text="كلها" t={t} at={2.3} out={3.1} /> <span style={{ opacity: ease(span(t, 2.42, 2.8)) * (1 - easeIO(span(t, 3.1, 3.4))), filter: `blur(${(1 - ease(span(t, 2.42, 2.8))) * 12}px)` }}><ShinyText text="في الخدمة" t={t} /></span></h1>
        </div>
      )}
      <Title t={t} win={[S.global[0], S.global[1]]} kicker="الكروت العالمية" title="ألعابك واشتراكاتك" sub="شحن رصيد وألعاب فوري وبأمان" rot={{ at: 5.0, every: 0.6, words: ['نتفليكس', 'ببجي', 'تيك توك', 'فورت نايت', 'كانفا برو'] }} />
      <Title t={t} win={[S.local[0], S.local[1]]} kicker="الكروت المحلية" title="رصيدك المحلي" rot={{ at: 9.0, every: 0.6, words: ['ليبيانا', 'المدار الجديد', 'LTT', 'ليبيانا'] }} />
      <Title t={t} win={[S.telegram[0], S.telegram[1]]} kicker="خدمات تيليجرام" title="نجوم وبريميوم" sub="أدخل معرّفك… والتنفيذ فوري" glass />
      <Title t={t} win={[S.khalis[0], S.khalis[1]]} kicker="خالص" title="شحن عداد الكهرباء" sub="صار أسهل، من محفظتك مباشرة" />
      <Title t={t} win={[S.streamers[0], S.streamers[1]]} kicker="دعم الإستريمرز" title="ادعم مبدعك المفضل" />
      <Title t={t} win={[S.gallery[0] + 0.3, S.gallery[1]]} title="كل خدماتك" sub="اليومية والرقمية في مكان واحد" />
      <Title t={t} win={[S.profile[0], S.profile[1]]} kicker="حسابي" title="محفظتك وطلباتك" sub="كلها تحت يدك" />

      {/* stageshow satellites */}
      <Sat x={540} y={1655} k={ease(span(t, 4.7, 5.15)) * (1 - easeIO(span(t, 7.3, 7.6)))} scale={2.35}>
        <Notification icon={<img src="../assets/brand/logo.png" alt="" style={{ background: '#fff' }} />} title="في الخدمة" body="شحن رصيد وألعاب فوري وبأمان" time="الآن" className="notif" />
      </Sat>
      <Sat x={300} y={1560} k={easeOutBack(span(t, CHIP_TG + 0.1, CHIP_TG + 0.55)) * (1 - easeIO(span(t, 15.4, 15.75)))} scale={3.0} from={-60}>
        <Chip><span className="chip-in">✓ bn0mardev@</span></Chip>
      </Sat>
      <Sat x={770} y={1480} k={easeOutBack(span(t, 16.95, 17.4)) * (1 - easeIO(span(t, 19.6, 19.9)))} scale={2.6} rot={-6}>
        <Badge tone="warning" className="kh-badge" icon={<span className="bolt">⚡</span>}>الآن من هاتفك</Badge>
      </Sat>
      <Sat x={300} y={1630} k={easeOutBack(span(t, 20.95, 21.4)) * (1 - easeIO(span(t, 23.3, 23.6)))} scale={2.6} rot={5}>
        <Badge tone="danger" dot className="live-badge">مباشر</Badge>
      </Sat>
      <Sat x={760} y={1640} k={easeOutBack(span(t, 21.15, 21.6)) * (1 - easeIO(span(t, 23.3, 23.6)))} scale={2.6} rot={-4}>
        <Badge tone="neutral" className="count-badge">المبدعون النشطون <CountUp to={13} t={t} at={21.3} /></Badge>
      </Sat>
      <Sat x={290} y={1600} k={easeOutBack(span(t, 28.95, 29.4)) * (1 - easeIO(span(t, 30.7, 31.0)))} scale={2.6} rot={-5}>
        <Badge tone="accent" className="ok-badge" icon={<span className="tick">✓</span>}>موثّق</Badge>
      </Sat>

      {/* end card */}
      {t > 31.7 && (
        <div className="endcard">
          <div className="logo-disc" style={{ opacity: clamp(endK * 2, 0, 1), transform: `scale(${0.4 + 0.6 * easeOutBack(span(t, 31.95, 32.65))}) rotate(${(1 - ease(span(t, 31.95, 32.7))) * -40}deg)` }}>
            <img src="../assets/brand/logo.png" alt="" />
          </div>
          <h1 className="end-name"><BlurText text="في الخدمة" t={t} at={32.35} step={0.12} /></h1>
          <div className="end-tag"><BlurText text="التطبيق الأول في ليبيا لخدمة المواطن إلكترونياً" t={t} at={32.8} step={0.06} /></div>
          <div className="store" style={{ opacity: ease(span(t, 33.5, 33.9)), transform: `translateY(${(1 - ease(span(t, 33.5, 33.9))) * 30}px)` }}>
            <img src="../assets/brand/google-play.svg" alt="" />
            <span><small>حمّله الآن من</small>Google Play</span>
          </div>
          <div className="creator" style={{ opacity: ease(span(t, 34.0, 34.4)) }}>
            <img src="../assets/brand/creator.jpg" alt="" />
            <span className="creator-text"><small>تصميم وموشن</small><Decrypted text={HANDLE} t={t} at={34.05} /></span>
          </div>
          <div className="unofficial" style={{ opacity: ease(span(t, 34.3, 34.7)) * 0.7 }}>إعلان غير رسمي · لقطات حقيقية من التطبيق</div>
        </div>
      )}

      <div className="handle" style={{ opacity: 0.85 * handleSmall }}>{HANDLE}</div>
    </div>
  );
}

// ---------- boot ----------
let renderer: any, bg: Grainient, cache: any, media: any[] = [], main: Screen, root: any;
const shots: Record<string, Screen> = {};

async function boot() {
  await document.fonts.load('800 100px Alexandria');
  await document.fonts.load('900 100px Alexandria');
  await document.fonts.load('600 100px Alexandria');
  await document.fonts.load('500 40px "IBM Plex Sans Arabic"');
  await document.fonts.load('500 40px Inter');
  await document.fonts.ready;
  await loadImages('../assets');
  const canvas = document.getElementById('stage') as HTMLCanvasElement;
  canvas.width = W; canvas.height = H;
  renderer = new Renderer(canvas, { preserve: true, samples: 4 });
  bg = new Grainient(W, H);
  cache = new TextCache();
  main = new Screen();
  media = [];
  main.paint('splash', screenState('splash', 0), 0);
  renderer.setMedia(0, main.canvas, SW, SH, { mips: true });
  media[0] = { width: SW, height: SH, role: 'mobile' };
  GALLERY.forEach((n, j) => {
    const s = new Screen(); s.paint(n, n === 'telegram' ? { typed: 9, chip: 1 } : {}, 0); shots[n] = s;
    renderer.setMedia(1 + j, s.canvas, SW, SH, { mips: true }); media[1 + j] = { width: SW, height: SH, role: 'mobile' };
  });
  GLOBAL_TILES.forEach((cy, i) => { const c = tile('global', cy); renderer.setMedia(6 + i, c, c.width, c.height, { mips: true }); media[6 + i] = { width: c.width, height: c.height, role: 'desktop' }; });
  LOCAL_TILES.forEach((cy, i) => { const c = tile('local', cy); renderer.setMedia(13 + i, c, c.width, c.height, { mips: true }); media[13 + i] = { width: c.width, height: c.height, role: 'desktop' }; });
  root = createRoot(document.getElementById('overlay')!);
  (window as any).__ready = true;
}

function renderAt(t: number) {
  // background
  const r = ramp(t);
  const reveal = clamp(span(t, 0, 1.8), 0, 1);
  bg.draw({ time: 3 + t * 0.16 * 1.4, ramp: r, angle: 55 + Math.sin(t * 0.2) * 10, reveal: 0.15 + 0.85 * reveal, frame: Math.floor(t * 24), silk: 0.4, flow: 0.9, grain: 0.06 });
  renderer.setBackgroundImage(bg.canvas, W, H);
  // the main screen
  const name = mainScreen(t);
  const live = name === 'streamers';
  if (main.paint(name, screenState(name, t), Math.round(t * FPS) / FPS, live)) renderer.setMedia(0, main.canvas, SW, SH, { mips: true });
  renderShot(renderer, buildDoc(t), media, { width: W, height: H, time: t, cache, seed: Math.floor(t * FPS) });
  flushSync(() => root.render(<Overlay t={t} />));
  return true;
}

(window as any).renderAt = renderAt;
(window as any).FILM = { FPS, DURATION };
boot();
