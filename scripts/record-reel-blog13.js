/**
 * LESSON:ON 랜딩 핵심 기능 릴스 MP4 생성 (Playwright 기반)
 * 사용법: node scripts/record-reel-blog13.js
 * 사전 조건: npx vite build --config vite.promo13.config.ts 완료 후 실행
 */
import { chromium } from 'playwright'
import { existsSync, renameSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync, spawnSync } from 'child_process'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// intro(2200) + before(2800) + after(3800) + deduct(3200) + outro(2500) = 14500
const TOTAL_MS  = 14500
const BUFFER_MS = 1500

const OUT_DIR   = resolve(ROOT, 'dist-promo/reel-blog13')
const HTML_PATH = resolve(OUT_DIR, 'promo-reel-blog13.html')

if (!existsSync(HTML_PATH)) {
  console.error('❌ 빌드 결과물이 없습니다. 먼저 빌드를 실행하세요:')
  console.error('   npx vite build --config vite.promo13.config.ts')
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })
console.log(`▶  Playwright 녹화 시작 (${((TOTAL_MS + BUFFER_MS) / 1000).toFixed(1)}초 대기)…`)

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: { width: 1080, height: 1920 } },
})
const page = await context.newPage()
await page.goto(`file://${HTML_PATH}?record`)
await page.waitForTimeout(400)
await page.waitForTimeout(TOTAL_MS + BUFFER_MS)

const videoPath = await page.video()?.path()
await context.close()
await browser.close()

if (!videoPath || !existsSync(videoPath)) {
  console.error('❌ 비디오 파일을 찾을 수 없습니다.')
  process.exit(1)
}

const mp4Path  = resolve(OUT_DIR, 'promo-reel-blog13.mp4')
const webmPath = resolve(OUT_DIR, 'promo-reel-blog13.webm')

let ffmpegBin = 'ffmpeg'
try { execSync('ffmpeg -version', { stdio: 'pipe' }) } catch {
  try { ffmpegBin = require('ffmpeg-static') } catch { ffmpegBin = null }
}

let converted = false
if (ffmpegBin) {
  const result = spawnSync(
    ffmpegBin,
    ['-y', '-i', videoPath, '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', mp4Path],
    { stdio: 'pipe' },
  )
  converted = result.status === 0
}

renameSync(videoPath, webmPath)

if (converted) {
  console.log('✅ MP4 생성 완료:', mp4Path)
  console.log('   WebM 원본    :', webmPath)
} else {
  console.log('⚠️  ffmpeg 미설치 — WebM으로 저장:', webmPath)
  console.log('   변환 명령: ffmpeg -i promo-reel-blog13.webm -c:v libx264 -crf 18 -pix_fmt yuv420p promo-reel-blog13.mp4')
}
