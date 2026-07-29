// promo-reel-blog12 → MP4 캡처 스크립트
// 실행: node scripts/capture-blog12.mjs
// (먼저 npm run dev 로 dev server가 떠 있어야 합니다)

import { chromium } from 'playwright'
import { execSync }  from 'child_process'
import { unlinkSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const require    = createRequire(import.meta.url)
const ffmpegPath = require('ffmpeg-static')
const __dirname  = path.dirname(fileURLToPath(import.meta.url))

const OUT_DIR  = path.resolve(__dirname, '..', 'dist-promo', 'reel-blog12')
const MP4_PATH = path.join(OUT_DIR, 'promo-reel-blog12.mp4')
const URL      = 'http://localhost:5173/promo-reel-blog12.html?record'

// intro 2000 + types 3000 + records 3200 + expiry 3000 + outro 2500 = 13700ms
const LOOP_MS  = 13700

console.log('🎬 Playwright Chromium 시작...')
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  recordVideo: {
    dir: OUT_DIR,
    size: { width: 1080, height: 1920 },
  },
})

const page = await context.newPage()

console.log(`⏳ ${URL}`)
console.log(`⏳ ${(LOOP_MS / 1000).toFixed(1)}초 녹화 중...`)
await page.goto(URL, { waitUntil: 'networkidle' })

// 애니메이션 한 루프 대기
await page.waitForTimeout(LOOP_MS + 600)

// context.close() 전에 video 객체 참조 확보
const video = page.video()
await context.close()
await browser.close()

const webmPath = await video.path()
console.log(`🔄 WebM → MP4 변환 중...`)
console.log(`   입력: ${webmPath}`)
console.log(`   출력: ${MP4_PATH}`)

execSync(
  `"${ffmpegPath}" -y -i "${webmPath}" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -movflags +faststart "${MP4_PATH}"`,
  { stdio: 'inherit' }
)

try { unlinkSync(webmPath) } catch (_) {}

console.log(`\n✅ 완료: ${MP4_PATH}`)
