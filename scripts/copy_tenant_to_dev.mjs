/**
 * 운영 DB의 램프팩토리 데이터를 개발 DB로 복사
 *
 * ⚠️  이 스크립트는 개발 DB(DEV_REF)만 수정합니다.
 *     운영 DB(PROD_REF)에는 SELECT만 수행하며 절대 쓰지 않습니다.
 *
 * 개발 DB에서는 auth.users FK를 제거해 실제 user_id를 그대로 유지합니다.
 * (로그인은 불가하지만 스케줄·회원 데이터가 운영과 동일하게 표시됩니다)
 */
import { readFileSync } from 'fs'

const TOKEN    = readFileSync('C:/Users/mytur/.supabase/access-token', 'utf8').trim()
const PROD_REF = 'bjnmaajhcmhxwonybnqc'   // 읽기 전용
const DEV_REF  = 'mcuszdvophmqrwostcah'   // 쓰기 대상
const PROD_TID = '5ce56d3f-8cd7-4d61-bec9-d6cc04a9d0d7'
const DEV_TID  = 'ec6baec1-b257-4097-b4d0-ce158ea969f4'

// auth.users FK가 있어 NULL 처리가 필요했던 컬럼 — FK 제거 후 불필요하지만
// created_by는 작성자 추적용으로만 쓰이므로 NULL 유지 (오류 방지)
const NULL_AUTH_COLS = new Set(['created_by'])

async function apiQuery(ref, sql, label = '') {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.log(`  ❌ HTTP ${res.status} ${label}: ${text.slice(0, 200)}`)
    return null
  }
  return res.json()
}

function lit(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v)) return `'{${v.map(i => String(i).replace(/'/g, "''")).join(',')}}'`
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`
  return `'${String(v).replace(/'/g, "''")}'`
}

// 개발 DB의 실제 컬럼 목록 조회
async function getDevCols(table) {
  const rows = await apiQuery(DEV_REF,
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${table}'`,
    'COLS')
  if (!rows) return null
  return new Set(rows.map(r => r.column_name))
}

// ── 개발 DB auth.users FK 제거 (개발 DB 전용 1회 설정) ─────────────────────
async function dropDevAuthFKs() {
  console.log('\n▶ 개발 DB auth.users FK 제거')
  const drops = [
    `ALTER TABLE profiles          DROP CONSTRAINT IF EXISTS profiles_id_fkey`,
    `ALTER TABLE assignments       DROP CONSTRAINT IF EXISTS assignments_user_id_fkey`,
    `ALTER TABLE tenant_members    DROP CONSTRAINT IF EXISTS tenant_members_user_id_fkey`,
    `ALTER TABLE lesson_packages   DROP CONSTRAINT IF EXISTS lesson_packages_user_id_fkey`,
    `ALTER TABLE lesson_packages   DROP CONSTRAINT IF EXISTS lesson_packages_created_by_fkey`,
    `ALTER TABLE assignment_snapshots DROP CONSTRAINT IF EXISTS assignment_snapshots_created_by_fkey`,
  ]
  for (const sql of drops) {
    const res = await apiQuery(DEV_REF, sql, 'DROP FK')
    if (res !== null) console.log(`  ✓ ${sql.match(/DROP CONSTRAINT IF EXISTS (\S+)/)?.[1]}`)
  }
}

// ── tenant_members: dev 고유 유저 멤버십 보존하며 복사 ────────────────────
async function copyTenantMembers() {
  console.log('\n▶ tenant_members')

  const devCols = await getDevCols('tenant_members')
  if (!devCols || devCols.size === 0) { console.log('  ⚠️  개발 DB에 테이블 없음'); return }

  // dev에서만 존재하는 유저 멤버십 저장 (운영에 없는 user_id → 개발 전용 계정)
  const prodMembers = await apiQuery(PROD_REF,
    `SELECT user_id FROM tenant_members WHERE tenant_id = '${PROD_TID}'`, 'PROD_USERS')
  const prodUserIds = (prodMembers ?? []).map(r => `'${r.user_id}'`).join(', ')

  const devOnlyRows = prodUserIds.length
    ? await apiQuery(DEV_REF,
        `SELECT * FROM tenant_members WHERE tenant_id = '${DEV_TID}' AND user_id NOT IN (${prodUserIds})`,
        'SAVE_DEV')
    : await apiQuery(DEV_REF,
        `SELECT * FROM tenant_members WHERE tenant_id = '${DEV_TID}'`,
        'SAVE_DEV')

  // 운영 데이터 조회 및 삽입
  const rows = await apiQuery(PROD_REF,
    `SELECT * FROM tenant_members WHERE tenant_id = '${PROD_TID}' ORDER BY id`, 'SELECT')
  if (!rows) return
  console.log(`  운영 ${rows.length}건 조회, dev 고유 ${(devOnlyRows ?? []).length}건 보존 예정`)

  await apiQuery(DEV_REF, `DELETE FROM tenant_members WHERE tenant_id = '${DEV_TID}'`, 'DELETE')

  const prodCols = rows.length ? Object.keys(rows[0]) : []
  const useCols  = prodCols.filter(c => devCols.has(c))

  let ok = 0, err = 0
  for (const row of [...rows, ...(devOnlyRows ?? [])]) {
    const cols = useCols.length ? useCols : Object.keys(row).filter(c => devCols.has(c))
    const vals = cols.map(c => {
      let v = row[c]
      if (c === 'tenant_id') v = DEV_TID
      else if (NULL_AUTH_COLS.has(c)) v = null
      return lit(v)
    })
    const sql = `INSERT INTO tenant_members (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING`
    const res = await apiQuery(DEV_REF, sql, 'INSERT')
    if (res !== null) ok++; else err++
  }
  console.log(`  삽입 완료 ${ok}건` + (err ? `, 실패 ${err}건` : ''))
}

// ── tenant_id 기반 테이블 복사 ─────────────────────────────────────────────
async function copyTable(table, orderBy = 'id') {
  console.log(`\n▶ ${table}`)

  const devCols = await getDevCols(table)
  if (!devCols || devCols.size === 0) {
    console.log(`  ⚠️  개발 DB에 테이블 없음 — 건너뜀`)
    return
  }

  const rows = await apiQuery(PROD_REF,
    `SELECT * FROM ${table} WHERE tenant_id = '${PROD_TID}' ORDER BY ${orderBy}`,
    'SELECT')
  if (!rows) return
  if (rows.length === 0) { console.log('  (운영 데이터 없음)'); return }
  console.log(`  운영 ${rows.length}건 조회`)

  await apiQuery(DEV_REF, `DELETE FROM ${table} WHERE tenant_id = '${DEV_TID}'`, 'DELETE')
  console.log(`  개발 기존 데이터 삭제`)

  const prodCols = Object.keys(rows[0])
  const useCols  = prodCols.filter(c => devCols.has(c))
  const skipped  = prodCols.filter(c => !devCols.has(c))
  if (skipped.length) console.log(`  ℹ️  개발에 없는 컬럼 제외: ${skipped.join(', ')}`)

  let ok = 0, err = 0
  for (const row of rows) {
    const vals = useCols.map(c => {
      let v = row[c]
      if (c === 'tenant_id') v = DEV_TID
      else if (NULL_AUTH_COLS.has(c)) v = null
      return lit(v)
    })
    const sql = `INSERT INTO ${table} (${useCols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING`
    const res = await apiQuery(DEV_REF, sql, 'INSERT')
    if (res !== null) ok++; else err++
  }
  console.log(`  삽입 완료 ${ok}건` + (err ? `, 실패 ${err}건` : ''))
}

// ── profiles 복사 (tenant_members 통해 해당 조직 회원만) ─────────────────────
async function copyProfiles() {
  console.log('\n▶ profiles (테넌트 회원)')

  const devCols = await getDevCols('profiles')
  if (!devCols || devCols.size === 0) { console.log('  ⚠️  개발 DB에 테이블 없음'); return }

  // 운영: 이 조직의 tenant_members에 속한 profiles 조회
  const rows = await apiQuery(PROD_REF,
    `SELECT DISTINCT p.* FROM profiles p
     INNER JOIN tenant_members tm ON tm.user_id = p.id
     WHERE tm.tenant_id = '${PROD_TID}'`,
    'SELECT')
  if (!rows) return
  if (rows.length === 0) { console.log('  (운영 데이터 없음)'); return }
  console.log(`  운영 ${rows.length}건 조회`)

  // 개발: 해당 user_id 목록 삭제 후 재삽입
  const userIds = rows.map(r => `'${r.id}'`).join(', ')
  await apiQuery(DEV_REF, `DELETE FROM profiles WHERE id IN (${userIds})`, 'DELETE')
  console.log(`  개발 기존 데이터 삭제`)

  const prodCols = Object.keys(rows[0])
  const useCols  = prodCols.filter(c => devCols.has(c))
  const skipped  = prodCols.filter(c => !devCols.has(c))
  if (skipped.length) console.log(`  ℹ️  개발에 없는 컬럼 제외: ${skipped.join(', ')}`)

  let ok = 0, err = 0
  for (const row of rows) {
    const vals = useCols.map(c => lit(row[c]))
    const sql = `INSERT INTO profiles (${useCols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${useCols.filter(c => c !== 'id').map(c => `${c}=EXCLUDED.${c}`).join(', ')}`
    const res = await apiQuery(DEV_REF, sql, 'INSERT')
    if (res !== null) ok++; else err++
  }
  console.log(`  삽입 완료 ${ok}건` + (err ? `, 실패 ${err}건` : ''))
}

// ── 실행 순서: auth FK 제거 → 부모 테이블 → 자식 테이블 ────────────────────
await dropDevAuthFKs()

await copyProfiles()                                          // auth.users FK 제거 후 복사
await copyTable('tenant_roles',         'id')
await copyTenantMembers()                                    // 회원-조직 관계 (dev 계정 보존)
await copyTable('time_slots',           'id')
await copyTable('lesson_package_types', 'id')
await copyTable('slot_settings',        'id')
await copyTable('schedule_rules',       'id')
await copyTable('date_overrides',       'date')
await copyTable('lesson_packages',      'created_at')
await copyTable('assignments',          'year, month, day, created_at')

console.log('\n✅ 완료')
