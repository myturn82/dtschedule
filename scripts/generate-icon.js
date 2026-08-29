/**
 * 버티컬별 앱 아이콘 생성 스크립트 (Playwright 기반)
 * 사용법: node scripts/generate-icon.js <vertical>
 * 예시:   node scripts/generate-icon.js lesson-on
 *
 * 출력:
 *   assets/icon-only.png             — @capacitor/assets Android 생성용 (1024×1024)
 *   public/icons/<vertical>/*.png    — PWA 홈화면 아이콘 5종
 *
 * 모서리 처리 원칙:
 *   - 모든 아이콘: fullbleed solid 브랜드색 (투명 픽셀 없음)
 *   - OS/브라우저가 플랫폼별 rounding을 자체 적용 → 흰 여백 없음
 */
import { chromium } from 'playwright'
import { writeFileSync, readFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const VERTICAL_ICONS = {
  'dts':        { type: 'dts',  fill: '#E05A3A' },
  'lesson-on':  { fill: '#D95E3E', text: 'LESSON', cells: [{ x: 0,  y: 16 }, { x: 48, y: 32 }] },
  'shift-on':   { fill: '#FB923C', text: 'SHIFT',  cells: [{ x: 16, y: 16 }, { x: 0,  y: 48 }] },
  'serve-on':   { fill: '#279E5E', text: 'SERVE',  cells: [{ x: 48, y: 16 }, { x: 32, y: 48 }] },
  'class-on':   { fill: '#7148CC', text: 'CLASS',  cells: [{ x: 32, y: 16 }, { x: 16, y: 48 }] },
  'work-on':    { fill: '#1795A8', text: 'WORK',   cells: [{ x: 0,  y: 32 }, { x: 48, y: 48 }] },
  'salon-on':   { fill: '#BD4BA8', text: 'SALON',  cells: [{ x: 16, y: 32 }, { x: 32, y: 48 }] },
  'care-on':    { fill: '#1EA893', text: 'CARE',   cells: [{ x: 48, y: 16 }, { x: 0,  y: 32 }] },
}

function buildSvg(conf, size) {
  if (conf.type === 'dts') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${conf.fill}"/>
  <text x="32" y="40" font-family="-apple-system,Arial" font-weight="800" font-size="22" letter-spacing="-0.5" fill="white" text-anchor="middle">DTS<tspan fill="rgba(255,255,255,0.55)">.</tspan></text>
</svg>`
  }

  const { fill, text, cells } = conf
  const cellsHtml = cells
    .map(({ x, y }) => `<rect x="${x}" y="${y}" width="16" height="16" fill="white" fill-opacity="0.09"/>`)
    .join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${fill}"/>
  <rect x="14" y="0" width="4" height="10" rx="2" fill="white" fill-opacity="0.35"/>
  <rect x="46" y="0" width="4" height="10" rx="2" fill="white" fill-opacity="0.35"/>
  <line x1="0" y1="16" x2="64" y2="16" stroke="white" stroke-opacity="0.22" stroke-width="1.2"/>
  <g stroke="white" stroke-opacity="0.1" stroke-width="1">
    <line x1="0" y1="32" x2="64" y2="32"/><line x1="0" y1="48" x2="64" y2="48"/>
    <line x1="16" y1="16" x2="16" y2="64"/><line x1="32" y1="16" x2="32" y2="64"/><line x1="48" y1="16" x2="48" y2="64"/>
  </g>
  ${cellsHtml}
  <text x="32" y="37" font-family="-apple-system,Arial" font-weight="700" font-size="13" letter-spacing="0" fill="white" text-anchor="middle">${text}</text>
  <text x="32" y="50" font-family="-apple-system,Arial" font-weight="700" font-size="13" letter-spacing="0.5" fill="white" fill-opacity="0.7" text-anchor="middle">ON</text>
</svg>`
}

async function renderToFile(page, svg, size, outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true })
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden">${svg}</body></html>`)
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } })
  writeFileSync(outputPath, buf)
  console.log(`   → ${outputPath} (${size}×${size})`)
}

// 1024px 소스 PNG를 img 태그로 리사이즈 — 네이티브 아이콘과 동일한 소스 보장
async function resizePngToFile(page, sourcePath, size, outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true })
  const sourceBase64 = readFileSync(sourcePath).toString('base64')
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden">
    <img id="i" src="data:image/png;base64,${sourceBase64}"
      width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px" />
  </body></html>`)
  await page.waitForLoadState('load')
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } })
  writeFileSync(outputPath, buf)
  console.log(`   → ${outputPath} (${size}×${size} resized from source)`)
}

async function generateIcon(vertical = 'lesson-on') {
  const conf = VERTICAL_ICONS[vertical]
  if (!conf) {
    console.error(`❌ Unknown vertical: ${vertical}`)
    console.error(`Available: ${Object.keys(VERTICAL_ICONS).join(', ')}`)
    process.exit(1)
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Capacitor용 1024px (Android 빌드 입력)
  await renderToFile(page, buildSvg(conf, 1024), 1024, 'assets/icon-only.png')

  // PWA 아이콘 → public/icons/<vertical>/  (1024px 소스에서 리사이즈 — 네이티브와 동일)
  const pwaDest = `public/icons/${vertical}`
  await resizePngToFile(page, 'assets/icon-only.png', 512, `${pwaDest}/icon-512.png`)
  await resizePngToFile(page, 'assets/icon-only.png', 192, `${pwaDest}/icon-192.png`)
  await resizePngToFile(page, 'assets/icon-only.png', 180, `${pwaDest}/apple-touch-icon.png`)
  await resizePngToFile(page, 'assets/icon-only.png', 512, `${pwaDest}/icon-maskable-512.png`)
  await resizePngToFile(page, 'assets/icon-only.png', 192, `${pwaDest}/icon-maskable-192.png`)

  // dts는 public/icons/ 기본 위치에도 복사 (dev 서버 참조 대상)
  if (vertical === 'dts') {
    const defaultDest = 'public/icons'
    await resizePngToFile(page, 'assets/icon-only.png', 512, `${defaultDest}/icon-512.png`)
    await resizePngToFile(page, 'assets/icon-only.png', 192, `${defaultDest}/icon-192.png`)
    await resizePngToFile(page, 'assets/icon-only.png', 180, `${defaultDest}/apple-touch-icon.png`)
    await resizePngToFile(page, 'assets/icon-only.png', 512, `${defaultDest}/icon-maskable-512.png`)
    await resizePngToFile(page, 'assets/icon-only.png', 192, `${defaultDest}/icon-maskable-192.png`)
    console.log(`   기본 위치: ${defaultDest}/`)
  }

  await browser.close()

  console.log(`\n✅ ${vertical} 아이콘 생성 완료`)
  if (vertical !== 'dts') {
    console.log(`\n다음 단계: npx @capacitor/assets generate --android`)
  }
}

generateIcon(process.argv[2])
