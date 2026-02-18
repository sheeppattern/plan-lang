import * as esbuild from 'esbuild';

const isProd = process.argv.includes('--production');

/** Shared config */
const common = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: !isProd,
  minify: isProd,
};

// 1) Bundle the extension client
const extBuild = esbuild.build({
  ...common,
  entryPoints: ['./src/extension.ts'],
  outfile: './dist/extension.js',
  external: ['vscode'], // vscode API is provided at runtime
});

// 2) Bundle the LSP server (+ plan-lang core baked in)
const serverBuild = esbuild.build({
  ...common,
  entryPoints: ['../server/src/server.ts'],
  outfile: './server/server.js',
  external: [], // everything bundled
});

await Promise.all([extBuild, serverBuild]);
console.log('Build complete.');
