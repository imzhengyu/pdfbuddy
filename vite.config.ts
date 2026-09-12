import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      // pdfjs-dist ships `eval("require")(workerSrc)` inside its Node-only
      // "fake worker" fallback (build/pdf.js:1982). That branch is dead code in
      // a browser bundle, but Rollup reports it as an EVAL warning on every
      // build. Drop just that one warning so real ones stay visible.
      onwarn(warning, warn) {
        const fromPdfjs = Boolean(warning.id && warning.id.includes('pdfjs-dist'));
        if (warning.code === 'EVAL' && fromPdfjs) {
          return;
        }
        warn(warning);
      },
      output: {
        // Keep the large third-party engines in their own chunks: they are
        // loaded on demand and their size is not something app code can fix.
        // This also keeps the bundle budget in scripts/run_build.py meaningful
        // for the code we actually write.
        manualChunks: {
          'vendor-pdf-lib': ['pdf-lib'],
          'vendor-jszip': ['jszip']
        }
      }
    }
  }
});
