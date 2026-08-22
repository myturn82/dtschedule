/**
 * Play Store 피처 그래픽 생성 (1024×500)
 * 사용법: node scripts/generate-feature-graphic.js
 * 출력: assets/feature-graphic.png
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const FILL  = '#D95E3E'
const BG    = '#0A0B10'
const W     = 1024
const H     = 500

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${W}px; height:${H}px; overflow:hidden;
    background:${BG};
    font-family:-apple-system,Arial,sans-serif;
    display:flex; align-items:center; justify-content:center;
    position:relative;
  }

  /* 배경 달력 그리드 */
  .grid {
    position:absolute; inset:0;
    display:grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(5, 1fr);
    gap:2px; padding:24px;
    opacity:0.07;
  }
  .cell {
    border-radius:4px;
    background:white;
  }
  .cell.filled { background:${FILL}; opacity:1; }

  /* 좌측 텍스트 영역 */
  .left {
    position:absolute;
    left:80px; top:50%;
    transform:translateY(-50%);
    display:flex; flex-direction:column; gap:18px;
  }

  .badge {
    display:inline-flex; align-items:center; gap:8px;
    background:rgba(217,94,62,0.15);
    border:1px solid rgba(217,94,62,0.35);
    border-radius:20px;
    padding:5px 14px;
    width:fit-content;
  }
  .badge-dot {
    width:7px; height:7px; border-radius:50%;
    background:${FILL};
    animation:none;
  }
  .badge-text {
    font-size:13px; font-weight:700;
    color:${FILL}; letter-spacing:0.5px;
  }

  .app-name {
    font-size:72px; font-weight:900;
    color:white; letter-spacing:-2px; line-height:1;
  }
  .app-name span { color:${FILL}; }

  .tagline {
    font-size:20px; color:rgba(255,255,255,0.55);
    font-weight:400; line-height:1.5;
    max-width:360px;
  }

  .features {
    display:flex; flex-direction:column; gap:8px;
    margin-top:4px;
  }
  .feature {
    display:flex; align-items:center; gap:10px;
    font-size:15px; color:rgba(255,255,255,0.7);
  }
  .feature-dot {
    width:5px; height:5px; border-radius:50%;
    background:${FILL}; flex-shrink:0;
  }

  /* 우측 미리보기 카드 */
  .right {
    position:absolute;
    right:60px; top:50%;
    transform:translateY(-50%);
    width:320px;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:16px;
    padding:20px;
  }

  .card-header {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:14px;
  }
  .card-title { font-size:13px; font-weight:700; color:rgba(255,255,255,0.7); }
  .card-badge {
    font-size:10px; color:${FILL};
    background:rgba(217,94,62,0.12);
    border:1px solid rgba(217,94,62,0.25);
    border-radius:4px; padding:2px 7px;
    display:flex; align-items:center; gap:4px;
  }
  .led { width:5px; height:5px; border-radius:50%; background:#22c55e; }

  .schedule-grid {
    display:grid;
    grid-template-columns:38px repeat(5,1fr);
    gap:3px;
  }
  .sh { font-size:9px; color:rgba(255,255,255,0.3); text-align:center; padding-bottom:3px; }
  .st { font-size:9px; color:rgba(255,255,255,0.28); display:flex; align-items:center; }
  .sc {
    height:24px; border-radius:4px;
    display:flex; align-items:center; justify-content:center;
    font-size:9px; color:rgba(255,255,255,0.75);
  }
  .sc.filled-cell {
    background:rgba(217,94,62,0.14);
    border:1px solid rgba(217,94,62,0.3);
  }
  .sc.empty-cell {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.07);
  }

  .divider {
    height:1px; background:rgba(255,255,255,0.06);
    margin:14px 0;
  }

  .stat-row {
    display:flex; gap:8px;
  }
  .stat {
    flex:1;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:8px; padding:8px 10px;
  }
  .stat-label { font-size:9px; color:rgba(255,255,255,0.35); margin-bottom:3px; }
  .stat-value { font-size:16px; font-weight:700; color:white; }
  .stat-sub { font-size:9px; color:rgba(217,94,62,0.8); margin-top:1px; }
</style>
</head>
<body>

<!-- 배경 그리드 -->
<div class="grid">
  ${Array.from({length:40}, (_,i) => {
    const filled = [2,5,9,13,17,18,22,26,29,33,37].includes(i)
    return `<div class="cell${filled?' filled':''}"></div>`
  }).join('')}
</div>

<!-- 좌측 텍스트 -->
<div class="left">
  <div class="badge">
    <div class="badge-dot"></div>
    <span class="badge-text">레슨 스케줄 관리</span>
  </div>

  <div class="app-name">LESSON<span>:ON</span></div>

  <div class="tagline">PT·요가·필라테스·수영 등<br>레슨 기반 시설을 위한 통합 관리 플랫폼</div>

  <div class="features">
    <div class="feature"><div class="feature-dot"></div>실시간 스케줄 동기화</div>
    <div class="feature"><div class="feature-dot"></div>월간·주간·일간 달력 보기</div>
    <div class="feature"><div class="feature-dot"></div>레슨권·회원 통합 관리</div>
    <div class="feature"><div class="feature-dot"></div>5분 초기 설정 완료</div>
  </div>
</div>

<!-- 우측 카드 -->
<div class="right">
  <div class="card-header">
    <div class="card-title">2026년 8월 · 주간</div>
    <div class="card-badge"><div class="led"></div>실시간</div>
  </div>

  <div class="schedule-grid">
    <div></div>
    ${['월','화','수','목','금'].map(d=>`<div class="sh">${d}</div>`).join('')}

    ${[
      {t:'10:00', cells:['이하나','','이하나','','성시호']},
      {t:'11:00', cells:['조은수','이하나','','박진희','']},
      {t:'14:00', cells:['','조은수','성시호','','이하나']},
      {t:'15:00', cells:['박진희','','','조은수','']},
    ].map(row=>`
    <div class="st">${row.t}</div>
    ${row.cells.map(n=>n
      ? `<div class="sc filled-cell">${n.slice(0,2)}</div>`
      : `<div class="sc empty-cell"></div>`
    ).join('')}
    `).join('')}
  </div>

  <div class="divider"></div>

  <div class="stat-row">
    <div class="stat">
      <div class="stat-label">이번 달 수업</div>
      <div class="stat-value">84</div>
      <div class="stat-sub">▲ 12% 지난달 대비</div>
    </div>
    <div class="stat">
      <div class="stat-label">활성 회원</div>
      <div class="stat-value">23</div>
      <div class="stat-sub">레슨권 보유 중</div>
    </div>
  </div>
</div>

</body>
</html>`

const browser = await chromium.launch()
const page    = await browser.newPage()
await page.setViewportSize({ width: W, height: H })
await page.setContent(html, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(200)

const buf = await page.screenshot({ type: 'png' })
writeFileSync('assets/feature-graphic.png', buf)
console.log('✓ assets/feature-graphic.png (1024×500)')

await browser.close()
