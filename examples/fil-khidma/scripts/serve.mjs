import http from 'http';import fs from 'fs';import path from 'path';
const root=path.resolve(process.argv[2]||'.');const port=+process.argv[3]||5177;
const types={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.css':'text/css'};
http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);s.end();return;}s.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});s.end(d);});}).listen(port);
