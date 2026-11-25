import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('http://localhost:5177/src/test.html');
await p.waitForFunction(()=>window.__ready,null,{timeout:60000});
for(let i=0;i<6;i++){let t0=Date.now();await p.evaluate(t=>window.renderAt(t),i/30);const t1=Date.now();await p.screenshot({path:`out/s${i}.jpg`,type:'jpeg',quality:92});console.log('render',t1-t0,'shot',Date.now()-t1);}
await b.close();
