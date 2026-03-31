import esbuild from 'esbuild';
import fs from 'fs';

await esbuild.build({
  entryPoints: ['src/http-client.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/http-client-temp.js',
  external: []
});

// Read and add shebang
const content = fs.readFileSync('dist/http-client-temp.js', 'utf8');
fs.writeFileSync('dist/http-client.js', '#!/usr/bin/env node\n' + content);
fs.unlinkSync('dist/http-client-temp.js');

console.log('HTTP client built!');
