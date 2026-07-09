// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    watch: {
      // OMC(.omc) 세션 상태 파일이 계속 갱신되며 dev 서버 워처를 자극하는 것을 방지
      ignored: ['**/.omc/**', '**/dist/**'],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: '다이나믹팀스케줄',
        short_name: 'DT스케줄',
        description: '다이나믹팀스케줄 - 멀티테넌트 시간대별 인원 배정 플랫폼',
        theme_color: '#14171C',
        background_color: '#E05A3A',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // /embed는 iframe 최상위 문서로 로드되므로, SW가 캐시된 index.html(전역 CSP 헤더)로
        // 가로채면 vercel.json의 /embed 전용 frame-ancestors 허용이 적용되지 않아 임베드가 깨진다.
        // 네트워크로 직접 요청이 가도록 SW 폴백 대상에서 제외한다.
        navigateFallbackDenylist: [/^\/embed/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/bjnmaajhcmhxwonybnqc\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/docx')) return 'vendor-docx'
          if (id.includes('node_modules/jspdf')) return 'vendor-pdf'
        },
      },
    },
  },
})
