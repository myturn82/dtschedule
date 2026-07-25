// 릴스 2편 전용 빌드 설정 — vite.promo.config.ts(1편)와 동일한 방식,
// 출력 디렉터리와 엔트리 HTML만 다르다.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: './',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://promo-placeholder.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('promo-placeholder-anon-key'),
  },
  build: {
    outDir: 'dist-promo/reel-blog2',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'promo-reel-blog2.html'),
    },
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    sourcemap: false,
    reportCompressedSize: false,
  },
})
