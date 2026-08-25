import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  // Relative URLs so a .ch5z loaded from the panel filesystem can find assets.
  base: './',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js',
          dest: '.',
          rename: { stripBase: true },
        },
      ],
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
  },
});
