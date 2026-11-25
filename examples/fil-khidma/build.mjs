import { build } from 'esbuild';
const opts = { entryPoints: ['src/film.tsx'], bundle: true, format: 'esm', loader: { '.woff2': 'file', '.svg': 'file', '.png': 'file' }, jsx: 'automatic', logLevel: 'warning', define: { 'process.env.NODE_ENV': '"production"' }, minify: true };
await build({ ...opts, outfile: 'hf/film.bundle.js', assetNames: 'lib/[name]-[hash]' });
