// 릴스(홍보 영상) 전용 일회성 빌드 설정 — 실제 앱의 vite.config.ts(react + tailwind)를
// 그대로 재사용하되, VitePWA 없이 단일 HTML 파일로 인라인 번들링한다.
// 실제 `npm run build`/배포 파이프라인과는 완전히 분리되어 있다 (package.json 스크립트 미등록).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: './',
  define: {
    // 실제 등록 팝업(SlotEditModal → useProfiles → useTenant)이 초기화 시 supabase.ts를 import하는데,
    // 그 파일은 env가 없으면 즉시 throw한다. 네트워크 호출은 CSP로 막혀 있어 안전하므로
    // 클라이언트 생성만 통과하도록 더미 값을 주입한다 (실제 프로젝트 키 아님, 실제 데이터 요청 없음).
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://promo-placeholder.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('promo-placeholder-anon-key'),
  },
  build: {
    outDir: 'dist-promo/reel-blog1',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'promo-reel-blog1.html'),
    },
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    sourcemap: false,
    reportCompressedSize: false,
  },
})
