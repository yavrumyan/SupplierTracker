// Vercel serverless function entry point.
// api/bundle.js is pre-built by vercel-build (esbuild --bundle) before @vercel/node runs.
// Importing from ./bundle.js (same directory) ensures nft includes it in the Lambda.
export { default } from './bundle.js';
