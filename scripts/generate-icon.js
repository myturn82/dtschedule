/**
 * 버티컬별 앱 아이콘 생성 스크립트 (Playwright 기반)
 * 사용법: node scripts/generate-icon.js <vertical>
 * 예시:   node scripts/generate-icon.js lesson-on
 *
 * 출력: assets/icon-only.png (1024x1024) — @capacitor/assets 입력용
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const VERTICAL_ICONS = {
  'lesson-on': { bgColor: '#F2604E', text: 'L:ON' },
  'shift-on':  { bgColor: '#2E7D32', text: 'S:ON' },
  'serve-on':  { bgColor: '#5B8A5B', text: 'SV:ON' },
  'class-on':  { bgColor: '#1A237E', text: 'C:ON' },
  'work-on':   { bgColor: '#0D1B2A', text: 'W:ON' },
  'salon-on':  { bgColor: '#7B5EA7', text: 'SL:ON' },
  'care-on':   { bgColor: '#2E7B5B', text: 'CA:ON' },
}

async function generateIcon(vertical = 'lesson-on', size = 1024) {
  const conf = VERTICAL_ICONS[vertical]
  if (!conf) {
    console.error(`❌ Unknown vertical: ${vertical}`)
    console.error(`Available: ${Object.keys(VERTICAL_ICONS).join(', ')}`)
    process.exit(1)
  }

  const { bgColor, text } = conf
  const outputPath = 'assets/icon-only.png'

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setViewportSize({ width: size, height: size })

  await page.setContent(`<!DOCTYPE html>
<html><body style="margin:0;padding:0;overflow:hidden">
<canvas id="c" width="${size}" height="${size}"></canvas>
<script>
  const c = document.getElementById('c')
  const ctx = c.getContext('2d')
  const s = ${size}
  const r = s * 0.22

  // 둥근 사각형 배경
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(s - r, 0)
  ctx.arcTo(s, 0, s, r, r)
  ctx.lineTo(s, s - r)
  ctx.arcTo(s, s, s - r, s, r)
  ctx.lineTo(r, s)
  ctx.arcTo(0, s, 0, s - r, r)
  ctx.lineTo(0, r)
  ctx.arcTo(0, 0, r, 0, r)
  ctx.closePath()
  ctx.fillStyle = '${bgColor}'
  ctx.fill()

  // 텍스트
  const fontSize = Math.floor(s * (${text.length} <= 4 ? 0.26 : 0.20))
  ctx.fillStyle = 'white'
  ctx.font = 'bold ' + fontSize + 'px "Arial Black", "Arial", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('${text}', s / 2, s / 2)
</script>
</body></html>`)

  const dataUrl = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'))
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')

  mkdirSync('assets', { recursive: true })
  writeFileSync(outputPath, buf)
  await browser.close()

  console.log(`✅ ${vertical} 아이콘 생성 완료: ${outputPath} (${size}x${size})`)
  console.log(`   색상: ${bgColor} / 텍스트: ${text}`)
  console.log(`\n다음 단계: npx @capacitor/assets generate --android`)
}

generateIcon(process.argv[2])
