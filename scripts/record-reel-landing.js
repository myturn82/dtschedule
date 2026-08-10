/**
 * LESSON:ON 랜딩 릴스 MP4 생성 스크립트 (Playwright 기반)
 * 사용법: node scripts/record-reel-landing.js
 *
 * 출력: dist-promo/reel-landing/promo-reel-landing.webm (→ .mp4)
 * 사전 조건: npx vite build --config vite.promo-landing.config.ts 완료 후 실행
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

// ── 루프 전체 길이 (App.tsx PHASES 합산)
const PHASE_MS = [2200, 2800, 3200, 3000, 2500]
const TOTAL_MS = PHASE_MS.reduce((s, v) => s + v, 0)
const BUFFER_MS = 1200  // 마지막 frame 안전 버퍼

const OUT_DIR = resolve(ROOT, 'dist-promo/reel-landing')
const HTML_PATH = resolve(OUT_DIR, 'promo-reel-landing.html')

if (!existsSync(HTML_PATH)) {
  console.error('❌ 빌드 결과물이 없습니다. 먼저 빌드를 실행하세요:')
  console.error('   npx vite build --config vite.promo-landing.config.ts')
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

console.log(`▶  Playwright 녹화 시작 (${((TOTAL_MS + BUFFER_MS) / 1000).toFixed(1)}초 대기)…`)

const browser = await chromium.launch({ headless: true })

const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: OUT_DIR,
    size: { width: 1080, height: 1920 },
  },
})

const page = await context.newPage()

// ?record 모드: reel이 뷰포트 꽉 채움 → 배경 hint 없음
await page.goto(`file://${HTML_PATH}?record`)

// 첫 frame 렌더 대기
await page.waitForTimeout(300)

// 전체 루프 + 버퍼만큼 대기
await page.waitForTimeout(TOTAL_MS + BUFFER_MS)

// 비디오 경로 확인 (close 전에 가져옴)
const videoPath = await page.video()?.path()

await context.close()
await browser.close()

if (!videoPath || !existsSync(videoPath)) {
  console.error('❌ 비디오 파일을 찾을 수 없습니다.')
  process.exit(1)
}

// ffmpeg 경로 결정 (시스템 → ffmpeg-static 순서로 탐색)
const mp4Path  = resolve(OUT_DIR, 'promo-reel-landing.mp4')
const webmPath = resolve(OUT_DIR, 'promo-reel-landing.webm')

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
  console.log('   WebM 원본:', webmPath)
} else {
  console.log('⚠️  ffmpeg 변환 실패 — WebM으로 저장:')
  console.log('   ', webmPath)
  console.log('   변환 명령: ffmpeg -i promo-reel-landing.webm -c:v libx264 -crf 18 -pix_fmt yuv420p promo-reel-landing.mp4')
}
