import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Renderer } from '../../fil-khidma/vendor/center-stage-engine/renderer.js';
import { renderShot, TextCache } from '../../fil-khidma/vendor/center-stage-engine/shot.js';
import { Badge, Chip } from '../../fil-khidma/vendor/stageshow-kit/index';
import '../../fil-khidma/vendor/stageshow-kit/stageshow.css';
import { Screen, loadImages, rowTile, tileFrom, logoTile, SW, SH, ease, easeIO, clamp } from './screens.js';
import { LINES, ITEMS, T, FPS, DURATION } from './timeline.js';
import './film.css';

const W = 1080, H = 1920;
const Q = new URLSearchParams(location.search);
const RES = Number(Q.get('res') || 1), PREVIEW = Q.get('preview') === '1';
const EW = Math.round(W * RES / 2) * 2, EH = Math.round(H * RES / 2) * 2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const back = (t: number) => { t = clamp(t, 0, 1); return 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2); };
const whip = (k: number) => { k = clamp(k, 0, 1); return k < 0.5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2; };

// ---------- the world ----------
// cards: 9:19.5 screens, scale 0.24 → 0.768 × 1.664 units, standing on the floor (y = 0)
const CARD_H = 1.664, CY = CARD_H / 2;
const ZONE = { hook: 0, global: 3.2, local: 6.4, tg: 9.6, kh: 12.8, tech: 16, end: 19.6 };
type Dev = { key: string; dev: any; rest: number[] };
const SCREENS = ['global', 'local', 'telegram', 'khalis', 'technicians', 'orders'];
const CARD_AT: Record<string, number[]> = {
  global: [ZONE.global, CY, 0, -16], local: [ZONE.local, CY, 0, 16], telegram: [ZONE.tg, CY, 0, -10],
  khalis: [ZONE.kh, CY, 0, 14], technicians: [ZONE.tech - 0.5, CY, 0, 16], orders: [ZONE.tech + 0.5, CY, 0.15, -16]
};
// hook tiles: 3 × 3 in the air, the dollar card in the middle
const TILE_ORDER = ['netflix', 'libyana', 'canva', 'pubg', 'nab', 'stars', 'madar', 'ltt', 'khalis'];
const TILE_S = 0.125; // 1:1 card at 0.1 → 0.32 units
function tileHome(name: string) {
  const i = TILE_ORDER.indexOf(name), c = i % 3, r = Math.floor(i / 3);
  return [ZONE.hook + (c - 1) * 0.5, 0.98 + (1 - r) * 0.5, 0];
}
const itemAt = (name: string) => ITEMS.find(it => it.tiles.includes(name))!.at;
// zone satellites: tiles that float beside each screen
const SAT_TILES: Record<string, { zone: number; side: number; list: string[] }> = {
  global: { zone: ZONE.global, side: 1, list: ['g_netflix', 'g_pubg', 'g_fortnite', 'g_tiktok'] },
  local: { zone: ZONE.local, side: -1, list: ['l_libyana', 'l_madar', 'l_ltt'] },
  kh: { zone: ZONE.kh, side: -1, list: ['k_khalis'] }
};

// ---------- the camera path (open world) ----------
type CamKey = { t: number; x: number; y: number; z?: number; w: number; rx: number; ry: number; e?: string };
const CAM: CamKey[] = [
  { t: 0, x: 0, y: 1.2, w: 1.75, rx: 4, ry: -6 },
  { t: 5.2, x: 0, y: 1.18, w: 1.7, rx: 4, ry: 4 },
  { t: 6.85, x: 0, y: 1.22, w: 1.6, rx: 5, ry: 2 },
  { t: T.toGlobal + 0.5, x: ZONE.global, y: 1.02, w: 1.6, rx: 6, ry: -14, e: 'whip' },
  { t: T.toLocal - 0.05, x: ZONE.global + 0.08, y: 1.0, w: 1.5, rx: 6, ry: -8 },
  { t: T.toLocal + 0.5, x: ZONE.local, y: 1.02, w: 1.6, rx: 6, ry: 14, e: 'whip' },
  { t: T.reveal - 0.05, x: ZONE.local - 0.08, y: 1.0, w: 1.5, rx: 6, ry: 8 },
  // re-hook: the camera rises and shows the whole world of services
  { t: T.reveal + 0.75, x: 10.4, y: 1.9, w: 5.4, rx: 20, ry: -24, e: 'io' },
  { t: T.toTg - 0.1, x: 10.6, y: 1.9, w: 5.1, rx: 20, ry: -18 },
  { t: T.toTg + 0.6, x: ZONE.tg, y: 1.02, w: 1.6, rx: 6, ry: -8, e: 'whip' },
  { t: T.typeStart - 0.2, x: ZONE.tg + 0.04, y: 1.05, w: 1.35, rx: 6, ry: -6 },
  { t: T.tgChip + 0.6, x: ZONE.tg + 0.04, y: 1.05, w: 1.3, rx: 6, ry: -5 },
  { t: T.toKh - 0.05, x: ZONE.tg, y: 1.0, w: 1.55, rx: 6, ry: -6 },
  { t: T.toKh + 0.5, x: ZONE.kh, y: 1.02, w: 1.6, rx: 6, ry: 14, e: 'whip' },
  { t: T.toTech - 0.05, x: ZONE.kh - 0.06, y: 1.0, w: 1.5, rx: 6, ry: 9 },
  { t: T.toTech + 0.5, x: ZONE.tech, y: 1.05, w: 2.25, rx: 7, ry: 0, e: 'whip' },
  { t: T.toEnd - 0.05, x: ZONE.tech, y: 1.03, w: 2.15, rx: 7, ry: 3 },
  { t: T.toEnd + 0.6, x: ZONE.end, y: 1.3, w: 2.9, rx: 6, ry: 0, e: 'whip' },
  { t: DURATION, x: ZONE.end, y: 1.3, w: 2.75, rx: 6, ry: 0 }
];
function cam(t: number) {
  let a = CAM[0], b = CAM[0];
  for (let i = 1; i < CAM.length; i++) { if (t <= CAM[i].t) { a = CAM[i - 1]; b = CAM[i]; break; } a = b = CAM[i]; }
  if (a === b) return a;
  const kk = (t - a.t) / (b.t - a.t);
  const k = b.e === 'whip' ? whip(kk) : easeIO(kk);
  const swing = b.e === 'whip' ? Math.sin(Math.PI * clamp(kk, 0, 1)) : 0;
  return {
    x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) + swing * 0.12, z: 0,
    w: Math.exp(lerp(Math.log(a.w), Math.log(b.w), k)) * (1 + swing * 0.35),
    rx: lerp(a.rx, b.rx, k), ry: lerp(a.ry, b.ry, k) + swing * (b.x >= a.x ? -10 : 10)
  };
}

// ---------- screen states ----------
function screenState(name: string, t: number) {
  const f = (a: number, d = 0.8) => ease(span(t, a, a + 0.22)) * (1 - easeIO(span(t, a + d, a + d + 0.22)));
  switch (name) {
    case 'global': return { rows: [[1422, f(8.0)], [969, f(8.7)]], tap: span(t, 9.6, 10.2), tapY: 969 };
    case 'local': return { rows: [[515, f(11.4, 0.55)], [667, f(12.0, 0.55)], [818, f(12.6, 0.55)]] };
    case 'telegram': return { typed: t < T.typeStart ? 0 : Math.floor((t - T.typeStart) / T.typeStep) + 1, caret: t > T.typeStart - 0.4 && t < T.tgTap ? 1 : 0, press: span(t, T.tgTap, T.tgTap + 0.35), chip: span(t, T.tgChip, T.tgChip + 0.4), tap: span(t, T.tgTap - 0.05, T.tgTap + 0.6) };
    case 'khalis': return { press: span(t, T.khTap, T.khTap + 0.5), tap: span(t, T.khTap - 0.05, T.khTap + 0.65) };
    case 'technicians': return { tap: span(t, T.techTap, T.techTap + 0.6), tapX: 0.5, tapY: 0.43 };
    case 'orders': return { tap: span(t, T.ordersTap, T.ordersTap + 0.6), tapX: 0.66, tapY: 0.52 };
    default: return {};
  }
}

// ---------- engine setup ----------
let renderer: any, cache: any, media: any[] = [], root: any;
const DEVS: Dev[] = [];
const screens: Record<string, Screen> = {};

function addDev(key: string, dev: any, rest: number[], m: any) {
  const slot = media.length; media.push(m); dev.slot = slot; DEVS.push({ key, dev, rest });
  return slot;
}

async function boot() {
  for (const f of ['900 100px Kufam', '800 100px Kufam', '700 100px Kufam', '500 40px Kufam', '600 40px Inter']) await document.fonts.load(f);
  await document.fonts.ready;
  await loadImages('assets');
  const canvas = document.getElementById('stage') as HTMLCanvasElement; canvas.width = EW; canvas.height = EH;
  renderer = new Renderer(canvas, { preserve: true, samples: 4 });
  cache = new TextCache();
  const sq = (c: HTMLCanvasElement) => ({ width: c.width, height: c.height, role: 'desktop' });
  // screen cards
  SCREENS.forEach(n => {
    const s = new Screen(); s.paint(n, screenState(n, 0), 0); screens[n] = s;
    const [x, y, z, ry] = CARD_AT[n];
    const slot = addDev(n, { type: 'card', finish: 'clean', radius: 0.42, viewport: '9:19.5', scale: 0.24, x, y, z, ry }, [x, y, z], { width: SW, height: SH, role: 'mobile' });
    renderer.setMedia(slot, s.canvas, SW, SH, { mips: true });
  });
  // hook tiles
  const crops: Record<string, () => HTMLCanvasElement> = {
    netflix: () => rowTile('global', 969), pubg: () => rowTile('global', 1876), canva: () => rowTile('global', 667), nab: () => rowTile('global', 1120),
    libyana: () => rowTile('local', 515), madar: () => rowTile('local', 667), ltt: () => rowTile('local', 818),
    stars: () => tileFrom('telegram', 80, 328, 198), khalis: () => tileFrom('khalis', 84, 327, 186)
  };
  TILE_ORDER.forEach(n => {
    const c = crops[n](); const h = tileHome(n);
    const slot = addDev('t_' + n, { type: 'card', finish: 'clean', radius: 0.22, viewport: '1:1', scale: TILE_S, x: h[0], y: h[1], z: h[2] }, h, sq(c));
    renderer.setMedia(slot, c, c.width, c.height, { mips: true });
  });
  // zone tiles
  const zc: Record<string, () => HTMLCanvasElement> = {
    g_netflix: () => rowTile('global', 969), g_pubg: () => rowTile('global', 1876), g_fortnite: () => rowTile('global', 818), g_tiktok: () => rowTile('global', 1271),
    l_libyana: () => rowTile('local', 515), l_madar: () => rowTile('local', 667), l_ltt: () => rowTile('local', 818), k_khalis: () => tileFrom('khalis', 84, 327, 186)
  };
  Object.values(SAT_TILES).forEach(({ zone, side, list }) => list.forEach((n, i) => {
    const c = zc[n](); const rest = [zone + side * 0.53, 0.5 + i * 0.36, 0.4];
    const slot = addDev(n, { type: 'card', finish: 'clean', radius: 0.22, viewport: '1:1', scale: 0.085, x: rest[0], y: rest[1], z: rest[2], ry: -side * 20 }, rest, sq(c));
    renderer.setMedia(slot, c, c.width, c.height, { mips: true });
  }));
  // the app's mark: once in the hook, once at the end
  const L = logoTile();
  const m1 = addDev('logo', { type: 'card', finish: 'clean', radius: 0.22, viewport: '1:1', scale: 0.17, x: ZONE.hook, y: 1.2, z: 0.1 }, [ZONE.hook, 1.2, 0.1], sq(L));
  renderer.setMedia(m1, L, L.width, L.height, { mips: true });
  const m2 = addDev('logo_end', { type: 'card', finish: 'clean', radius: 0.22, viewport: '1:1', scale: 0.15, x: ZONE.end, y: 1.55, z: 0.5 }, [ZONE.end, 1.55, 0.5], sq(L));
  renderer.setMedia(m2, L, L.width, L.height, { mips: true });
  root = createRoot(document.getElementById('overlay')!);
  (window as any).__ready = true;
}

// per-device offsets at time t
function offsets(t: number) {
  return DEVS.map(({ key, rest }) => {
    const o: any = { x: 0, y: 0, z: 0, spin: 0, tilt: 0, roll: 0, scale: 1, opacity: 1 };
    const bob = (ph: number, a = 0.02) => Math.sin(t * 1.6 + ph) * a;
    if (key.startsWith('t_')) {
      const n = key.slice(2), at = itemAt(n), i = TILE_ORDER.indexOf(n);
      const inK = back(span(t, at, at + 0.42));
      const big = n === 'nab' ? 0.35 * back(span(t, at, at + 0.5)) * (1 - easeIO(span(t, T.merge - 0.2, T.merge))) : 0;
      const m = easeIO(span(t, T.merge + i * 0.025, T.merge + 0.42 + i * 0.025));
      o.y = (1 - inK) * 1.4 + bob(i, 0.015);
      o.spin = (1 - inK) * 70 * (i % 2 ? 1 : -1) + Math.sin(t * 0.9 + i) * 6;
      o.tilt = (1 - inK) * -40 + Math.cos(t * 0.8 + i) * 5;
      o.scale = (0.4 + 0.6 * inK + big) * (1 - 0.85 * m);
      o.x = (ZONE.hook - rest[0]) * m; o.y += (1.2 - rest[1]) * m; o.z = 0.25 * m;
      o.opacity = clamp(inK * 4, 0, 1) * (1 - span(m, 0.8, 1));
    } else if (key === 'logo') {
      const first = (1 - easeIO(span(t, 1.45, 1.75)));
      const k = Math.max(first, back(span(t, T.merge + 0.25, T.merge + 0.85)));
      const out = easeIO(span(t, T.toGlobal, T.toGlobal + 0.3));
      o.scale = 0.2 + 0.8 * k; o.opacity = clamp(k * 3, 0, 1) * (1 - out);
      o.spin = (t < 2 ? -14 + t * 10 : (1 - k) * -200) + Math.sin(t * 1.2) * 8; o.y = bob(0, 0.03) - (t < 2 ? 0.2 : 0);
    } else if (key === 'logo_end') {
      const k = back(span(t, T.toEnd + 0.45, T.toEnd + 1.05));
      o.scale = 0.2 + 0.8 * k; o.opacity = clamp(k * 3, 0, 1); o.spin = (1 - k) * 220 + Math.sin(t * 1.1) * 6; o.y = bob(1, 0.025);
    } else if (SCREENS.includes(key)) {
      // each screen rises out of the floor before the camera arrives; at the end all gather behind the mark
      const arrive: Record<string, number> = { global: T.toGlobal - 0.1, local: T.toLocal - 0.1, telegram: T.reveal - 0.1, khalis: T.reveal, technicians: T.reveal + 0.1, orders: T.reveal + 0.2 };
      const k = back(span(t, arrive[key], arrive[key] + 0.6));
      o.y = (1 - k) * -1.9; o.tilt = (1 - k) * 25; o.y += bob(SCREENS.indexOf(key), 0.012);
      const e = easeIO(span(t, T.toEnd + 0.1 + SCREENS.indexOf(key) * 0.04, T.toEnd + 0.75 + SCREENS.indexOf(key) * 0.04));
      if (e > 0) {
        const j = SCREENS.indexOf(key) - 2.5, ang = j * 0.36;
        const tx = ZONE.end + Math.sin(ang) * 1.6, tz = -0.6 - (1 - Math.cos(ang)) * 1.6;
        o.x += (tx - rest[0]) * e; o.z += (tz - rest[2]) * e; o.y += 0.06 * e;
        o.spin = -CARD_AT[key][3] * e + (-ang * 57.3 * 0.9) * e; o.scale = 1 - 0.1 * e;
      }
    } else {
      // zone tiles: pop out of the screen, float, leave
      const zoneName = key[0] === 'g' ? 'global' : key[0] === 'l' ? 'local' : 'kh';
      const z = SAT_TILES[zoneName]; const i = z.list.indexOf(key);
      const start = zoneName === 'global' ? T.toGlobal + 0.55 : zoneName === 'local' ? T.toLocal + 0.55 : T.toKh + 0.6;
      const end = zoneName === 'global' ? T.toLocal - 0.25 : zoneName === 'local' ? T.reveal - 0.2 : T.toTech - 0.25;
      const k = back(span(t, start + i * 0.1, start + 0.55 + i * 0.1)) * (1 - easeIO(span(t, end, end + 0.25)));
      o.x = -z.side * 0.5 * (1 - k); o.scale = 0.3 + 0.7 * k; o.opacity = clamp(k * 3, 0, 1);
      o.y = bob(i * 1.3, 0.03); o.spin = Math.sin(t + i) * 10; o.roll = Math.sin(t * 0.7 + i) * 6;
    }
    return o;
  });
}

function buildDoc(t: number) {
  const c = cam(t);
  const off = offsets(t);
  return {
    aspect: '9:16',
    devices: DEVS.map(d => d.dev),
    camera: { rx: c.rx, ry: c.ry, fov: 28, pad: 0, frame: [c.w, c.w * 16 / 9], frameCenter: [c.x, c.y, 0] },
    background: { kind: 'solid', colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] },
    light: { shadow: 0.5, softness: 0.78, distance: 0.12, height: 64, angle: -24, receiver: 'floor', glare: 0.04 },
    finish: { grain: 0, vignette: 0 },
    motion: { kind: 'script', fn: () => ({ each: (i: number) => off[i] }) }
  };
}

// ---------- text (React Bits effects on the film clock) ----------
function Words({ text, t, at, out, hi = [], step = 0.075, className = '' }: any) {
  const words = text.split(' ');
  const o = out !== undefined ? 1 - easeIO(span(t, out, out + 0.28)) : 1;
  return (
    <span className={`words ${className}`}>
      {words.map((w: string, i: number) => {
        const k = ease(span(t, at + i * step, at + i * step + 0.38));
        return <span key={i} className={hi.includes(w) ? 'hi' : ''} style={{ opacity: k * o, filter: `blur(${(1 - k) * 12 + (1 - o) * 10}px)`, transform: `translateY(${(1 - k) * 34 - (1 - o) * 24}px)` }}>{w}{i < words.length - 1 ? ' ' : ''}</span>;
      })}
    </span>
  );
}

function Hook({ t }: { t: number }) {
  if (t > T.merge + 0.2) return null;
  const l1 = LINES[0];
  const up = easeIO(span(t, ITEMS[0].at - 0.15, ITEMS[0].at + 0.25));
  const cur = [...ITEMS].reverse().find(it => t >= it.at);
  const idx = cur ? ITEMS.indexOf(cur) : -1;
  return (
    <div className="hook">
      <div className="hook-head" style={{ transform: `translateY(${-up * 40}px) scale(${1 - up * 0.32})` }}>
        <Words text="تطبيق ليبي واحد…" t={t} at={-0.4} step={0.1} out={T.merge - 0.1} />
        <br />
        <Words text="يوفّرلك كل شي!" t={t} at={0.55} hi={['كل', 'شي!']} out={T.merge - 0.1} />
      </div>
      {cur && (
        <div className="hook-item" key={idx}>
          {ITEMS.map((it, i) => {
            const k = ease(span(t, it.at, it.at + 0.22));
            const next = ITEMS[i + 1]; const o = next ? 1 - easeIO(span(t, next.at - 0.06, next.at + 0.1)) : 1 - easeIO(span(t, T.merge - 0.15, T.merge + 0.1));
            if (k <= 0 || o <= 0) return null;
            return <div key={i} className={`item ${i === ITEMS.length - 1 ? 'last' : ''}`} style={{ opacity: k * o, transform: `scale(${1.35 - 0.35 * back(span(t, it.at, it.at + 0.3))}) translateY(${(1 - o) * -30}px)`, filter: `blur(${(1 - k) * 14}px)` }}>{it.word}</div>;
          })}
        </div>
      )}
      <div className="progress">{ITEMS.map((it, i) => <span key={i} className={t >= it.at ? 'on' : ''} />)}</div>
    </div>
  );
}

function Caption({ t }: { t: number }) {
  return (
    <>
      {LINES.slice(2).map(l => {
        if (t < l.a - 0.05 || t > l.b + 0.35) return null;
        const big = l.id === 'l3' || l.id === 'l6';
        return (
          <div key={l.id} className={`cap ${big ? 'big' : ''} ${l.id}`}>
            <Words text={l.screen ?? l.text} t={t} at={l.a} out={l.b} hi={l.hi} step={big ? 0.12 : 0.07} />
          </div>
        );
      })}
    </>
  );
}

function Sat({ children, x, y, k, scale = 2.4, rot = 0 }: any) {
  if (k <= 0.001) return null;
  return <div className="sat ss-stage" data-theme="light" style={{ left: x, top: y, opacity: clamp(k * 1.5, 0, 1), transform: `translate(-50%,-50%) translateY(${(1 - k) * 40}px) rotate(${rot * (1 - k)}deg) scale(${scale * (0.85 + 0.15 * k)})` }}>{children}</div>;
}

function Overlay({ t }: { t: number }) {
  const endK = ease(span(t, T.toEnd + 1.6, T.toEnd + 2.0));
  return (
    <div className="overlay" dir="rtl">
      <Hook t={t} />
      <Caption t={t} />
      <Sat x={300} y={1520} k={back(span(t, T.toTg + 0.7, T.toTg + 1.1)) * (1 - easeIO(span(t, T.toKh - 0.3, T.toKh)))} rot={-5}>
        <Badge tone="accent" className="b-orange" icon={<span className="bolt">⚡</span>}>خدمة رقمية فورية</Badge>
      </Sat>
      <Sat x={760} y={1440} k={back(span(t, T.toKh + 0.75, T.toKh + 1.15)) * (1 - easeIO(span(t, T.toTech - 0.3, T.toTech)))} rot={6}>
        <Badge tone="warning" className="b-yellow" icon={<span className="bolt">⚡</span>}>الآن من هاتفك</Badge>
      </Sat>
      <Sat x={540} y={1560} k={back(span(t, T.ordersTap + 0.1, T.ordersTap + 0.5)) * (1 - easeIO(span(t, T.toEnd - 0.3, T.toEnd)))}>
        <Chip><span className="chip-ok">✓ مكتمل</span></Chip>
      </Sat>
      {t > T.toEnd + 1.5 && (
        <div className="store" style={{ opacity: endK, transform: `translate(-50%, ${(1 - endK) * 30}px)` }}>
          <img src="assets/brand/google-play.svg" alt="" />
          <span><small>نزّله الآن من</small>Google Play</span>
        </div>
      )}
    </div>
  );
}

function renderAt(t: number) {
  // live screens: repaint only when their state changes
  SCREENS.forEach(n => {
    const live = n === 'telegram' && t > T.typeStart - 0.5 && t < T.tgTap;
    if (screens[n].paint(n, screenState(n, t), Math.round(t * 30) / 30, live)) {
      const d = DEVS.find(d => d.key === n)!; renderer.setMedia(d.dev.slot, screens[n].canvas, SW, SH, { mips: true });
    }
  });
  renderShot(renderer, buildDoc(t), media, { width: EW, height: EH, time: t, cache, seed: Math.floor(t * FPS), preview: PREVIEW });
  flushSync(() => root.render(<Overlay t={t} />));
  return true;
}

(window as any).renderAt = renderAt;
(window as any).FILM = { FPS, DURATION };
boot();
