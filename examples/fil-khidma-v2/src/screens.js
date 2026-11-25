// Screen painters for the screen cards (no phone, no status bar). Real app screenshots,
// personal data removed, small live moments drawn as a pure function of time.
export const SW = 1179;
export const SH = 2555; // the card's 9:19.5 screen
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeIO = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export { clamp };

export const images = {};
export async function loadImages(base) {
  const names = ['global', 'local', 'telegram', 'khalis', 'streamers', 'technicians', 'orders'];
  await Promise.all(names.map(async n => { const im = new Image(); im.src = `${base}/screens/${n}.jpg`; await im.decode(); images[n] = im; }));
  const logo = new Image(); logo.src = `${base}/brand/logo.png`; await logo.decode(); images.logo = logo;
}

// user screenshots: 1080x2400, measured in a 900-wide copy (x1.2), Android bar = top 100 px
const K = SW / 1080, M = 1.2, TOP = 100;
const X = v => v * M * K;
const Y = v => (v * M - TOP) * K;
function base(g, name, bottom = '#f8f9fb') {
  g.fillStyle = bottom; g.fillRect(0, 0, SW, SH);
  g.drawImage(images[name], 0, TOP, 1080, 2400 - TOP, 0, 0, SW, (2400 - TOP) * K);
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function tap(g, cx, cy, k, color = 'rgba(20,20,30,') {
  if (k <= 0 || k >= 1) return;
  const press = Math.sin(Math.PI * clamp(k / 0.45, 0, 1));
  g.fillStyle = color + (0.16 * press) + ')'; g.beginPath(); g.arc(cx, cy, 70 + 10 * press, 0, Math.PI * 2); g.fill();
  const r = ease((k - 0.15) / 0.85);
  if (k > 0.15) { g.strokeStyle = color + (0.35 * (1 - r)) + ')'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 70 + 130 * r, 0, Math.PI * 2); g.stroke(); }
}
function rows(g, list) {
  list.forEach(([y, a]) => {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.strokeStyle = '#f26430'; g.lineWidth = 8;
    rr(g, X(40), Y(y - 66), X(822) - X(40), Y(y + 66) - Y(y - 66), 40); g.stroke(); g.restore();
  });
}

function telegram(g, s) {
  base(g, 'telegram');
  g.fillStyle = 'rgb(248,249,251)'; g.fillRect(X(395), Y(848), X(700) - X(395), Y(910) - Y(848));
  const word = 'username', n = Math.floor(clamp(s.typed ?? word.length, 0, word.length));
  g.fillStyle = '#1b1f2a'; g.font = '500 44px Inter'; g.textAlign = 'left'; g.direction = 'ltr';
  const txt = word.slice(0, n); g.fillText(txt, X(418), Y(892));
  if (s.caret && Math.floor((s.time ?? 0) * 2.2) % 2 === 0) { const w = g.measureText(txt).width; g.fillStyle = '#f26430'; g.fillRect(X(418) + w + 4, Y(856), 5, Y(902) - Y(856)); }
  const p = s.press ?? 0;
  if (p > 0 && p < 1) { g.fillStyle = `rgba(80,20,0,${0.22 * Math.sin(Math.PI * p)})`; rr(g, X(73), Y(817), X(276) - X(73), Y(945) - Y(817), 46); g.fill(); }
  // the verified chip shows the typed name (the screenshot's own handle is covered)
  g.fillStyle = '#fff'; g.fillRect(X(520), Y(995), X(830) - X(520), Y(1105) - Y(995));
  const c = ease(s.chip ?? 0);
  if (c > 0) {
    g.save(); g.globalAlpha = c; const cx = X(683), cy = Y(1050), w = X(807) - X(560), h = Y(1093) - Y(1008);
    g.translate(cx, cy); g.scale(0.85 + 0.15 * c, 0.85 + 0.15 * c);
    g.fillStyle = '#fff3ec'; g.strokeStyle = 'rgba(242,100,48,0.35)'; g.lineWidth = 3; rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill(); g.stroke();
    g.fillStyle = '#1b1f2a'; g.font = '600 38px Inter'; g.textAlign = 'center'; g.fillText('username@', -14, 13);
    g.fillStyle = '#f26430'; g.beginPath(); g.arc(w / 2 - 44, 0, 13, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  tap(g, X(175), Y(881), s.tap ?? 0, 'rgba(255,255,255,');
}

// official Play Store screenshots, 540x1206, dark theme
function store(g, name, s) {
  const im = images[name], k = SW / 540;
  if (name === 'technicians') {
    g.fillStyle = 'rgb(11,20,17)'; g.fillRect(0, 0, SW, SH);
    g.drawImage(im, 0, 40, 540, 145, 0, 0, SW, 145 * k); // header «أطلب فني»
    g.drawImage(im, 0, 352, 540, 854, 0, 145 * k, SW, 854 * k); // categories, without the people row
  } else {
    g.fillStyle = 'rgb(4,8,11)'; g.fillRect(0, 0, SW, SH);
    g.drawImage(im, 0, 40, 540, 1166, 0, 0, SW, 1166 * k);
    g.fillStyle = 'rgb(4,8,11)'; g.fillRect(250 * k, (118 - 40) * k, 210 * k, 30 * k); // the account name
  }
  tap(g, SW * (s.tapX ?? 0.5), SH * (s.tapY ?? 0.3), s.tap ?? 0, 'rgba(242,100,48,');
}

function streamers(g, s, t) {
  base(g, 'streamers');
  [752, 523, 294, 65].forEach((cx, i) => {
    const ph = ((t * 0.9 + i * 0.23) % 1);
    g.strokeStyle = `rgba(242,100,48,${0.55 * (1 - ph)})`; g.lineWidth = 8;
    g.beginPath(); g.arc(X(cx), Y(415), X(92) + X(40) * ph, 0, Math.PI * 2); g.stroke();
  });
}

const PAINT = {
  global: (g, s) => { base(g, 'global'); rows(g, s.rows || []); tap(g, X(450), Y(s.tapY || 969), s.tap ?? 0); },
  local: (g, s) => { base(g, 'local'); rows(g, s.rows || []); tap(g, X(450), Y(s.tapY || 515), s.tap ?? 0); },
  telegram: (g, s) => telegram(g, s),
  khalis: (g, s) => {
    base(g, 'khalis'); const p = s.press ?? 0;
    if (p > 0 && p < 1) { g.fillStyle = `rgba(255,255,255,${0.18 * Math.sin(Math.PI * clamp(p / 0.5, 0, 1))})`; rr(g, X(90), Y(1157), X(810) - X(90), Y(1275) - Y(1157), 60); g.fill(); }
    tap(g, X(450), Y(1216), s.tap ?? 0, 'rgba(255,214,0,');
  },
  streamers: (g, s, t) => streamers(g, s, t),
  technicians: (g, s) => store(g, 'technicians', s),
  orders: (g, s) => store(g, 'orders', s)
};

export class Screen {
  constructor() { this.canvas = document.createElement('canvas'); this.canvas.width = SW; this.canvas.height = SH; this.g = this.canvas.getContext('2d'); this.key = ''; }
  paint(name, state = {}, t = 0, live = false) {
    const key = live ? `${name}|${t}` : `${name}|${JSON.stringify(state)}`;
    if (key === this.key) return false;
    this.key = key; const g = this.g; g.save(); g.clearRect(0, 0, SW, SH); PAINT[name](g, { ...state, time: t }, t); g.restore(); return true;
  }
}

// square tiles for the hook: icons cropped from the real screens
export function tileFrom(name, x0, y0, size900, out = 512) {
  const c = document.createElement('canvas'); c.width = out; c.height = out; const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(images[name], x0 * M + 2, y0 * M + 2, size900 * M - 4, size900 * M - 4, 0, 0, out, out);
  return c;
}
export const rowTile = (name, cy) => tileFrom(name, 753, cy - 46, 92);

// the app's mark as a tile: orange, white disc, the logo
export function logoTile(out = 1024) {
  const c = document.createElement('canvas'); c.width = out; c.height = out; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, out, out); gr.addColorStop(0, '#ff7a3d'); gr.addColorStop(1, '#e8501c');
  g.fillStyle = gr; g.fillRect(0, 0, out, out);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(out / 2, out / 2, out * 0.34, 0, Math.PI * 2); g.fill();
  const L = out * 0.6; g.drawImage(images.logo, (out - L) / 2, (out - L) / 2, L, L);
  return c;
}
