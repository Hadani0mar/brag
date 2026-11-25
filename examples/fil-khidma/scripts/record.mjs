// node scripts/record.mjs stills <outdir> t1 t2 ...   |   node scripts/record.mjs frames <outdir> <from> <to>
import { chromium } from 'playwright';
import fs from 'fs';
const [mode, out, ...rest] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.log('pageerror', e.message));
p.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
await p.goto(`http://localhost:${process.env.PORT || 5177}/build/index.html${process.env.Q || ''}`);
await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
const shoot = async (t, file) => { await p.evaluate(t => window.renderAt(t), t); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => r()))); await p.screenshot({ path: file, type: 'jpeg', quality: mode === 'frames' ? 94 : 88 }); };
if (mode === 'stills') { for (const t of rest.map(Number)) { await shoot(t, `${out}/t${t.toFixed(2)}.jpg`); console.log('still', t); } }
else {
  const fps = 30; const [from, to] = rest.map(Number);
  for (let f = from; f < to; f++) { const file = `${out}/f${String(f).padStart(5, '0')}.jpg`; if (fs.existsSync(file)) continue; await shoot(f / fps, file); if (f % 30 === 0) console.log('frame', f); }
}
await b.close();
