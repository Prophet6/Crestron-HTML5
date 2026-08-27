import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js',
          dest: '.',
          rename: { stripBase: true },
        },
        {
          src: 'contracts/divisible-room.cse2j',
          dest: 'config',
          rename: 'contract.cse2j',
        },
      ],
    }),
  ],
  server: {
    host: true,
    port: 5174,
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
  },
});
