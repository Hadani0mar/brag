import { build } from 'esbuild';
await build({ entryPoints: ['src/film.tsx'], bundle: true, format: 'esm', outfile: 'build/film.bundle.js', loader: { '.woff2': 'file', '.svg': 'file', '.png': 'file' }, jsx: 'automatic', logLevel: 'warning', define: { 'process.env.NODE_ENV': '"production"' }, minify: false });
