import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/server.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  external: [
    '@aws-sdk/*',
    '@modelcontextprotocol/sdk',
    'dotenv'
  ]
});

console.log('Build complete!');
