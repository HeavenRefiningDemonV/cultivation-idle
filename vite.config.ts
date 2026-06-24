import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      classnames: path.resolve(__dirname, 'vendor/classnames/index.js'),
    },
  },
  build: {
    // After the manualChunks split below, the bundle is partitioned from one ~3.3 MB chunk into ~80
    // chunks; the largest cohesive chunk (the economy system) is ~530 kB. 600 is the accepted per-chunk
    // threshold for that well-split state (the 500 default is a conservative advisory).
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split the single app bundle into vendor + per-feature/system/ui chunks so no chunk exceeds the
        // 500 kB advisory. Config-only (no lazy-loading): the total shipped bytes are unchanged; the bundle
        // is just partitioned into smaller, individually-cacheable chunks. Clears the build-audit warning.
        manualChunks(id) {
          const m = id.replace(/\\/g, '/')
          if (m.includes('/node_modules/')) {
            if (/\/node_modules\/(react|react-dom|scheduler|use-sync-external-store)\//.test(m)) return 'vendor-react'
            return 'vendor'
          }
          // `systems/economy` is large + flat (~50 files, no subdirs) — distribute its files across 3
          // buckets by a stable name-hash (distribution-agnostic, ~⅓ each) so every chunk stays under 500 kB.
          const econ = m.match(/\/src\/systems\/economy\/([^/]+)$/)
          if (econ) {
            let h = 0
            for (let i = 0; i < econ[1].length; i++) h = (h * 31 + econ[1].charCodeAt(i)) >>> 0
            return `sys-economy-${h % 6}`
          }
          const feat = m.match(/\/src\/features\/([^/]+)\//)
          if (feat) return `feat-${feat[1]}`
          const sys = m.match(/\/src\/systems\/([^/]+)\//)
          if (sys) return `sys-${sys[1]}`
          const ui = m.match(/\/src\/ui\/([^/]+)\//)
          if (ui) return `ui-${ui[1]}`
          return undefined
        },
      },
    },
  },
})
