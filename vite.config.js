import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import compression from 'vite-plugin-compression'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

function copyDataFiles() {
  return {
    name: 'copy-data-files',
    closeBundle() {
      const srcDir = resolve('public/data')
      const destDir = resolve('dist/data')
      const files = ['cross-references.bin', 'bible-lookup.bin']

      mkdirSync(destDir, { recursive: true })
      files.forEach(f => {
        const src = resolve(srcDir, f)
        const dest = resolve(destDir, f)
        if (existsSync(src)) {
          copyFileSync(src, dest)
          console.log(`✓ copied ${f}`)
        } else {
          console.warn(`⚠ not found: ${f}`)
        }
      })
    }
  }
}

export default defineConfig({
  publicDir: 'public',
  base: '/',
  server: {
    host: true,
    port: 5173,
    hmr: {
      host: 'localhost',
    },
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  plugins: [
    react(),
    compression({ algorithm: 'gzip', threshold: 1024 }),
    copyDataFiles(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/(cross-references|bible-lookup)\.bin$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bible-data',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Scripture Graph',
        short_name: 'Scripture Graph',
        description: '341,000 biblical cross-references visualised',
        theme_color: '#080808',
        background_color: '#080808',
        display: 'standalone',
        start_url: 'https://scripturegraph.com/',  // ← add this
        scope: '/',                                 // ← add this
        icons: [
          { src: '/icons/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
    cloudflare()
  ],
})