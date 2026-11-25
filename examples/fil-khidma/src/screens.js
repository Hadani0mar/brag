// Screen painters: the user's real screenshots, cropped under the iPhone status bar
// (the 3D phone draws its own), with the small live moments drawn on top as a function of time.

export const SW = 1179; // canvas width = phone content width
export const SH = 2382; // content aspect of the engine's phone below its status bar
const SRC_TOP = 100; // the Android status bar in the screenshots (1080x2400)
const K = SW / 1080;
// the screenshots were measured in a 900-wide copy; 1.2 maps them to the 1080 originals
const M = 1.2;
const X = v => v * M * K;
const Y = v => (v * M - SRC_TOP) * K;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIO = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

export const images = {};
export async function loadImages(base) {
  const names = ['global', 'local', 'telegram', 'khalis', 'streamers', 'profile'];
  await Promise.all(names.map(async n => { const im = new Image(); im.src = `${base}/screens/${n}.jpg`; await im.decode(); images[n] = im; }));
  const logo = new Image(); logo.src = `${base}/brand/logo.png`; await logo.decode(); images.logo = logo;
}

function base(g, name) {
  const im = images[name];
  g.drawImage(im, 0, SRC_TOP, 1080, 2400 - SRC_TOP, 0, 0, SW, (2400 - SRC_TOP) * K);
}

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// a finger tap: a soft disc that presses and a ring that spreads
function tap(g, cx, cy, k, color = 'rgba(20,20,30,') {
  if (k <= 0 || k >= 1) return;
  const press = Math.sin(Math.PI * clamp(k / 0.45, 0, 1));
  g.fillStyle = color + (0.16 * press) + ')';
  g.beginPath(); g.arc(cx, cy, 70 + 10 * press, 0, Math.PI * 2); g.fill();
  const r = ease((k - 0.15) / 0.85);
  if (k > 0.15) {
    g.strokeStyle = color + (0.35 * (1 - r)) + ')'; g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, 70 + 130 * r, 0, Math.PI * 2); g.stroke();
  }
}

// splash: the app's own launch screen (orange, white disc with the mark, name)
function splash(g, t, s) {
  g.fillStyle = '#f26a32'; g.fillRect(0, 0, SW, SH);
  const grd = g.createRadialGradient(SW / 2, SH * 0.42, 50, SW / 2, SH * 0.42, SH * 0.7);
  grd.addColorStop(0, 'rgba(255,170,120,0.35)'); grd.addColorStop(1, 'rgba(200,60,20,0.25)');
  g.fillStyle = grd; g.fillRect(0, 0, SW, SH);
  const k = ease(s.splash ?? 1);
  const cx = SW / 2, cy = SH * 0.42, R = 230 * (0.7 + 0.3 * k);
  g.globalAlpha = k;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  const L = R * 1.45; g.drawImage(images.logo, cx - L / 2, cy - L / 2, L, L);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.direction = 'rtl';
  g.font = '800 128px Alexandria'; g.fillText('في الخدمة', cx, cy + R + 200);
  g.font = '500 50px "IBM Plex Sans Arabic"'; g.globalAlpha = k * 0.9;
  g.fillText('المنصة الأولى في ليبيا التي تخدم المواطن', cx, cy + R + 300);
  g.globalAlpha = 1;
}

// list rows highlighted one after another (global and local cards)
function rowFocus(g, rows, k) {
  if (!k) return;
  rows.forEach(([y, a]) => {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.strokeStyle = '#f26430'; g.lineWidth = 7;
    rr(g, X(40), Y(y - 66), X(822) - X(40), Y(y + 66) - Y(y - 66), 40); g.stroke(); g.restore();
  });
}

function telegram(g, s) {
  base(g, 'telegram');
  // the username field, typed live
  const fx0 = X(395), fy0 = Y(848), fx1 = X(700), fy1 = Y(910);
  g.fillStyle = 'rgb(248,249,251)'; g.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
  const word = 'bn0mardev';
  const n = Math.floor(clamp(s.typed ?? 9, 0, 9));
  g.fillStyle = '#1b1f2a'; g.font = '500 44px Inter'; g.textAlign = 'left'; g.direction = 'ltr';
  const txt = word.slice(0, n); const tx = X(418), ty = Y(892);
  g.fillText(txt, tx, ty);
  if ((s.caret ?? 0) > 0 && Math.floor((s.time ?? 0) * 2.2) % 2 === 0) {
    const w = g.measureText(txt).width; g.fillStyle = '#f26430'; g.fillRect(tx + w + 4, Y(856), 5, Y(902) - Y(856));
  }
  // the verify button: pressed
  const p = s.press ?? 0;
  if (p > 0 && p < 1) {
    const d = Math.sin(Math.PI * p);
    g.fillStyle = `rgba(80,20,0,${0.22 * d})`; rr(g, X(73), Y(817), X(276) - X(73), Y(945) - Y(817), 46); g.fill();
  }
  // the verified chip: hidden until the check, then wiped in
  const c = clamp(s.chip ?? 1, 0, 1);
  if (c < 1) {
    g.save(); g.fillStyle = '#fff';
    const x0 = X(520), x1 = X(820);
    const open = ease(c);
    g.fillRect(x0, Y(995), (x1 - x0) * (1 - open), Y(1105) - Y(995));
    g.restore();
  }
  tap(g, X(175), Y(881), s.tap ?? 0, 'rgba(255,255,255,');
}

function khalis(g, s) {
  base(g, 'khalis');
  const p = s.press ?? 0;
  if (p > 0 && p < 1) {
    const d = Math.sin(Math.PI * clamp(p / 0.5, 0, 1));
    g.fillStyle = `rgba(255,255,255,${0.18 * d})`; rr(g, X(90), Y(1157), X(810) - X(90), Y(1275) - Y(1157), 60); g.fill();
  }
  tap(g, X(450), Y(1216), s.tap ?? 0, 'rgba(255,214,0,');
}

function streamers(g, s, t) {
  base(g, 'streamers');
  // live rings breathe; the loading cards shimmer (they are the app's own skeletons)
  [752, 523, 294, 65].forEach((cx, i) => {
    const ph = ((t * 0.9 + i * 0.23) % 1);
    g.strokeStyle = `rgba(242,100,48,${0.55 * (1 - ph)})`; g.lineWidth = 8;
    g.beginPath(); g.arc(X(cx), Y(415), X(92) + X(40) * ph, 0, Math.PI * 2); g.stroke();
  });
  const sweep = (((t * 0.55) % 1.4) - 0.2);
  [[47, 902, 853, 1487], [47, 1525, 853, 2050]].forEach(([x0, y0, x1, y1]) => {
    g.save(); rr(g, X(x0), Y(y0), X(x1) - X(x0), Y(y1) - Y(y0), 60); g.clip();
    const cx = X(x0) + (X(x1) - X(x0) + 600) * sweep - 300;
    const gr = g.createLinearGradient(cx - 260, 0, cx + 260, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.65)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(X(x0), Y(y0), X(x1) - X(x0), Y(y1) - Y(y0)); g.restore();
  });
}

function profile(g, s) {
  base(g, 'profile');
  // the phone number is personal: replaced by a soft pill
  g.fillStyle = '#fff'; g.fillRect(X(640), Y(756), X(830) - X(640), Y(804) - Y(756));
  g.fillStyle = '#e7eaf0'; rr(g, X(668), Y(766), X(812) - X(668), Y(796) - Y(766), 16); g.fill();
}

const PAINT = {
  splash: (g, s, t) => splash(g, t, s),
  global: (g, s) => { base(g, 'global'); rowFocus(g, s.rows || [], 1); tap(g, X(450), Y(s.tapY || 969), s.tap ?? 0); },
  local: (g, s) => { base(g, 'local'); rowFocus(g, s.rows || [], 1); tap(g, X(450), Y(s.tapY || 515), s.tap ?? 0); },
  telegram: (g, s) => telegram(g, s),
  khalis: (g, s) => khalis(g, s),
  streamers: (g, s, t) => streamers(g, s, t),
  profile: (g, s) => profile(g, s)
};

export class Screen {
  constructor() { this.canvas = document.createElement('canvas'); this.canvas.width = SW; this.canvas.height = SH; this.g = this.canvas.getContext('2d'); this.key = ''; }
  // returns true when the pixels changed
  paint(name, state = {}, t = 0, live = false) {
    const key = live ? `${name}|${t}` : `${name}|${JSON.stringify(state)}`;
    if (key === this.key) return false;
    this.key = key;
    const g = this.g; g.save(); g.clearRect(0, 0, SW, SH);
    PAINT[name](g, { ...state, time: t }, t);
    g.restore();
    return true;
  }
}

// a square tile cropped from a list row's icon (900-space centre y), for the floating 3D cards
export function tile(name, cy, size = 512) {
  const c = document.createElement('canvas'); c.width = size; c.height = size; const g = c.getContext('2d');
  const im = images[name]; const s = 92 * M; const x = 753 * M + 2, y = (cy - 46) * M + 2;
  g.imageSmoothingQuality = 'high';
  g.drawImage(im, x, y, s - 4, s - 4, 0, 0, size, size);
  return c;
}
export { ease, easeIO, clamp };
