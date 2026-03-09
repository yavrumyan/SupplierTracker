// Build script for Vercel Lambda: bundles server code with esbuild.
// Uses --define to eliminate dev-only code (vite/rollup) at compile time.
import { build } from 'esbuild';

await build({
  entryPoints: ['server/index.ts'],
  platform: 'node',
  packages: 'external',
  bundle: true,
  format: 'esm',
  outfile: 'api/bundle.js',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

console.log('Lambda bundle written to api/bundle.js');
