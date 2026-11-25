import { build } from 'esbuild';
await build({ entryPoints: ['src/film.tsx'], bundle: true, format: 'esm', outfile: 'hf/film.bundle.js', assetNames: 'lib/[name]-[hash]', loader: { '.woff2': 'file', '.svg': 'file', '.png': 'file' }, jsx: 'automatic', logLevel: 'warning', define: { 'process.env.NODE_ENV': '"production"' }, minify: true });
