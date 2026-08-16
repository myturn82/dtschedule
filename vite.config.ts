// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const VERTICAL_TO_FAVICON: Record<string, string> = {
  'lessonon': 'lesson-on',
  'shifton':  'shift-on',
  'serveon':  'serve-on',
  'classon':  'class-on',
  'workon':   'work-on',
  'salonon':  'salon-on',
  'careon':   'care-on',
}

export default defineConfig(({ command, mode }) => {
  // loadEnv로 .env.[mode] 파일 + 시스템 env 모두 읽음 (process.env는 config 평가 시점에 파일 미로드)
  const env = loadEnv(mode, process.cwd(), '')

  const vertical     = env.VITE_VERTICAL
  const brandNameRaw = env.VITE_BRAND_NAME
  // VITE_ICON_KEY 우선, 없으면 VITE_VERTICAL로 폴백
  const faviconKey   = env.VITE_ICON_KEY
                    ?? (vertical ? VERTICAL_TO_FAVICON[vertical] : null)
  const iconKey      = faviconKey ?? 'dts'
  const iconDir      = `/icons/${iconKey}`
  const brandName    = (brandNameRaw ?? '다이나믹팀스케줄').replace(/^["']|["']$/g, '')
  // VITE_BRAND_NAME이 명시되면 brandName을 short_name으로 사용 (faviconKey 유무 무관)
  const shortName    = brandNameRaw ? brandName : 'DT스케줄'
  const brandColor   = (env.VITE_BRAND_COLOR   ?? '#14171C').replace(/^["']|["']$/g, '')
  const tagline      = (env.VITE_BRAND_TAGLINE  ?? '다이나믹팀스케줄 - 멀티테넌트 스케줄 관리 플랫폼').replace(/^["']|["']$/g, '')

  const verticalFaviconPlugin = {
    name: 'vertical-favicon',
    transformIndexHtml(html: string) {
      if (!faviconKey && !brandNameRaw) return html
      let result = html
      if (faviconKey) {
        result = result
          .replace('href="/favicon.svg"', `href="/favicons/${faviconKey}.svg"`)
          .replace('href="/icons/apple-touch-icon.png"', `href="${iconDir}/apple-touch-icon.png"`)
      }
      return result
        .replace(/<title>[^<]*<\/title>/, `<title>${brandName}</title>`)
        .replace(/(<meta name="theme-color" content=")[^"]*(")/,                `$1${brandColor}$2`)
        .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/,  `$1${brandName}$2`)
        .replace(/(<meta name="description" content=")[^"]*(")/,                `$1${tagline}$2`)
    },
  }

  return {
    server: {
      watch: {
        // OMC(.omc) 세션 상태 파일이 계속 갱신되며 dev 서버 워처를 자극하는 것을 방지
        ignored: ['**/.omc/**', '**/dist/**', '**/dist-promo/**'],
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      verticalFaviconPlugin,
      // 개발 서버에서는 SW를 완전히 비활성화 (HMR 오프라인 방지)
      command === 'build' && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicons/*.svg', `icons/${iconKey}/*.png`],
        manifest: {
          name:             brandName,
          short_name:       shortName,
          description:      tagline,
          theme_color:      brandColor,
          background_color: '#0a0b10',
          display:          'standalone',
          start_url:        '/',
          scope:            '/',
          icons: [
            { src: `${iconDir}/icon-192.png`,          sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: `${iconDir}/icon-512.png`,          sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: `${iconDir}/apple-touch-icon.png`,  sizes: '180x180', type: 'image/png', purpose: 'any' },
            { src: `${iconDir}/icon-maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: `${iconDir}/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          // /embed는 iframe 최상위 문서로 로드되므로, SW가 캐시된 index.html(전역 CSP 헤더)로
          // 가로채면 vercel.json의 /embed 전용 frame-ancestors 허용이 적용되지 않아 임베드가 깨진다.
          // 네트워크로 직접 요청이 가도록 SW 폴백 대상에서 제외한다.
          navigateFallbackDenylist: [/^\/embed/, /^\/promo-reel-blog/],
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
        input: {
          main:       'index.html',
          'blog1':  'promo-reel-blog1.html',
          'blog2':  'promo-reel-blog2.html',
          'blog3':  'promo-reel-blog3.html',
          'blog4':  'promo-reel-blog4.html',
          'blog5':  'promo-reel-blog5.html',
          'blog6':  'promo-reel-blog6.html',
          'blog7':  'promo-reel-blog7.html',
          'blog8':  'promo-reel-blog8.html',
          'blog9':  'promo-reel-blog9.html',
          'blog10': 'promo-reel-blog10.html',
          'blog11': 'promo-reel-blog11.html',
          'blog12': 'promo-reel-blog12.html',
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/docx')) return 'vendor-docx'
            if (id.includes('node_modules/jspdf')) return 'vendor-pdf'
          },
        },
      },
    },
  }
})
