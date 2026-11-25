import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.log('err', e.message));
await p.goto('http://localhost:5177/hf/index.html' + (process.env.Q || ''));
await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
for (const t of [5.0, 5.033, 5.066, 13.3, 21.8]) {
  const r = await p.evaluate(t => window.__profile(t), t);
  const t0 = Date.now(); await p.screenshot({ type: 'jpeg', quality: 90 }); r.shot = Date.now() - t0;
  console.log(t, JSON.stringify(r));
}
await b.close();
