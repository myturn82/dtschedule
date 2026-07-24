import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// 실제 앱 컴포넌트를 그대로 import — 재구현·목업 없음
import { ScheduleHeader } from '../../components/schedule/ScheduleHeader'
import { MonthScheduleByDay } from '../../components/schedule/MonthScheduleByDay'
import { SlotEditModal } from '../../components/modals/SlotEditModal'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import { getCellState } from '../../utils/cellState'
import type { Assignment, Profile } from '../../types'
import { SCENARIOS, YEAR, MONTH, REGISTER_TARGET, REGISTER_MEMBER_NAME, type Scenario } from './mockData'

const noop = () => {}
const asyncNull = async () => null

const FAKE_PROFILE: Profile = {
  id: 'me', name: REGISTER_MEMBER_NAME, email: null, phone: null, avatar_url: null,
  is_super_admin: false, is_approved: true, terms_agreed_at: null, privacy_agreed_at: null, created_at: '',
}

type Phase = 'intro' | 'a' | 'register' | 'b' | 'c' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro', ms: 2200 },
  { key: 'a', ms: 2600 },
  { key: 'register', ms: 4600 },
  { key: 'b', ms: 3000 },
  { key: 'c', ms: 3000 },
  { key: 'outro', ms: 2600 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const SCENARIO_BY_PHASE: Partial<Record<Phase, Scenario>> = {
  a: SCENARIOS[0],
  register: SCENARIOS[0],
  b: SCENARIOS[1],
  c: SCENARIOS[2],
}

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: { kicker: 'Multi-tenant', headline: '조직마다 다른\n운영 모드', sub: '회원공유 · 회원개별 · 비회원 — 하나의 플랫폼에서 조직에 맞게' },
  register: { kicker: '회원공유 모드', headline: '빈 슬롯을 클릭하면\n바로 등록', sub: '실제 등록 팝업 그대로 — 이름 확인 후 저장 한 번' },
}

function usePhaseLoop() {
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    timer.current = setTimeout(() => setIdx(i => (i + 1) % PHASES.length), PHASES[idx].ms)
    return () => clearTimeout(timer.current)
  }, [idx])
  return { phase: PHASES[idx].key, idx }
}

export default function App() {
  const { phase, idx } = usePhaseLoop()
  const scenario = SCENARIO_BY_PHASE[phase]
  const isHero = phase === 'a' || phase === 'register' || phase === 'b' || phase === 'c'
  const bgScenario = scenario ?? (phase === 'intro' ? SCENARIOS[0] : SCENARIOS[SCENARIOS.length - 1])

  // 등록 데모용 로컬 상태 — 실제 SlotEditModal의 onAdd가 호출하는 데이터
  const [extraAssignments, setExtraAssignments] = useState<Assignment[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [cursorAt, setCursorAt] = useState<'off' | 'cell' | 'save'>('off')

  useEffect(() => {
    if (phase === 'intro') { setExtraAssignments([]); setModalOpen(false); setCursorAt('off') }
  }, [phase])

  useEffect(() => {
    if (phase !== 'register') return
    setCursorAt('cell')
    const t1 = setTimeout(() => setModalOpen(true), 600)
    const t2 = setTimeout(() => setCursorAt('save'), 2200)
    // 실제 저장 버튼을 진짜로 클릭한다 — SlotEditModal 내부 handleAdd()가 그대로 실행됨
    const t3 = setTimeout(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '저장')
      btn?.click()
    }, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [phase])

  const boardAssignments = bgScenario.key === 'shared' ? [...bgScenario.assignments, ...extraAssignments] : bgScenario.assignments

  const registerCellState = getCellState(
    REGISTER_TARGET.day, REGISTER_TARGET.timeSlot, YEAR, MONTH,
    SCENARIOS[0].scheduleRules, SCENARIOS[0].slotSettings, [], boardAssignments,
  )

  const caption = CAPTION[phase] ?? scenario

  return (
    <div className="stage">
      <div className="reel">
        {/* 실제 스케줄 보드 — 항상 뒷배경으로 깔리고, 카메라 포커싱(scale/blur)만 Framer Motion으로 제어 */}
        <motion.div
          className="boardbg"
          animate={{
            scale: isHero ? 1 : 1.05,
            filter: isHero ? 'blur(0px) brightness(1) saturate(1)' : 'blur(4px) brightness(0.5) saturate(0.85)',
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <div className="boardwindow">
            <ScheduleHeader year={YEAR} month={MONTH} viewType="month" onPrev={noop} onNext={noop} displayMode="day" onDisplayModeChange={noop} />
            <AnimatePresence mode="wait">
              <motion.div
                key={bgScenario.key}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4 }}
              >
                <MonthScheduleByDay
                  year={YEAR}
                  month={MONTH}
                  timeSlots={bgScenario.timeSlots}
                  assignments={boardAssignments}
                  slotSettings={bgScenario.slotSettings}
                  scheduleRules={bgScenario.scheduleRules}
                  dateOverrides={[]}
                  displayAssignmentFilter={bgScenario.displayAssignmentFilter}
                  onCellClick={noop}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 등록 데모 커서 */}
        {phase === 'register' && (
          <motion.div
            className="cursor"
            animate={{
              opacity: cursorAt === 'off' ? 0 : 1,
              left: cursorAt === 'save' ? '50%' : '62%',
              top: cursorAt === 'save' ? '86%' : '46%',
              scale: cursorAt === 'save' ? [1, 0.7, 1] : 1,
            }}
            transition={{ left: { type: 'spring', stiffness: 150, damping: 20 }, top: { type: 'spring', stiffness: 150, damping: 20 }, scale: { duration: 0.3 } }}
          />
        )}

        <div className="scrim" />
        <div className="scrimtop" />

        <div className="progress">
          {PHASES.map((p, i) => (
            <div className="seg" key={p.key}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: i <= idx ? '100%' : '0%' }}
                transition={i === idx ? { duration: p.ms / 1000, ease: 'linear' } : { duration: 0 }}
              />
            </div>
          ))}
        </div>
        <div className="brandmark"><b>DTS</b><small>Dynamic Team Schedule</small></div>

        <div className="content">
          <AnimatePresence mode="wait">
            {phase !== 'outro' && !(phase === 'register' && modalOpen) && (
              <motion.div
                key={phase}
                className="captionblock"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: 10, transition: { duration: 0.25 } }}
              >
                {isHero && phase !== 'register' && (
                  <motion.div className="orglabel" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                    <b>{scenario!.orgName}</b>
                    <span>{scenario!.orgTagline}</span>
                  </motion.div>
                )}
                <motion.p className="kicker" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption?.kicker}
                </motion.p>
                <motion.h1 className="headline" variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}>
                  {caption?.headline.split('\n').map((l, i) => (
                    <span key={i}>{l}{i === 0 && <br />}</span>
                  ))}
                </motion.h1>
                <motion.p className="sub" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption?.sub}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'outro' && (
              <motion.div
                className="outrowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              >
                <div className="wordmark">Dynamic<br />Team <em>Schedule</em></div>
                <p className="tagline">다중 조직과 스케줄을 한 곳에서</p>
                <motion.div
                  className="cta"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}
                >
                  지금 시작하기 →
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 실제 스케줄 등록 팝업 — SlotEditModal을 그대로 사용, 실제 저장 버튼을 실제로 클릭해서 등록한다 */}
        {modalOpen && (
          <SlotEditModal
            target={REGISTER_TARGET}
            cellState={registerCellState}
            profile={FAKE_PROFILE}
            tenantRole={null}
            memberRoleId={null}
            tenantMode="회원공유"
            customFields={[]}
            slotLabels={{}}
            typeLabels={{ member: '팀원', '50plus': '' }}
            tenantId="promo-tenant"
            onClose={() => setModalOpen(false)}
            onAdd={async (name, note, memberType, timeSub, _color, userId, roleId, customerName, customerPhone, extraData) => {
              setExtraAssignments(prev => [...prev, {
                id: `reg-${Date.now()}`,
                tenant_id: 'promo-tenant', year: YEAR, month: MONTH,
                day: REGISTER_TARGET.day, time_slot: REGISTER_TARGET.timeSlot,
                member_name: name, note: note || null, member_type: memberType,
                time_sub: timeSub, color: null, user_id: userId ?? FAKE_PROFILE.id,
                role_id: roleId ?? null, customer_name: customerName ?? null, customer_phone: customerPhone ?? null,
                extra_data: extraData, is_locked: false, account_deleted: false, created_at: '',
              }])
              return null
            }}
            onUpdate={asyncNull}
            onDelete={asyncNull}
          />
        )}
      </div>
      <p className="hint"><b>이 프레임(9:16)만 화면 녹화</b>하면 됩니다. 전체 루프는 약 {(TOTAL / 1000).toFixed(0)}초이며 자연스럽게 반복됩니다. 달력과 등록 팝업 모두 실제 앱 컴포넌트(ScheduleHeader / MonthScheduleByDay / SlotEditModal)를 그대로 사용했습니다.</p>
    </div>
  )
}

export function AppRoot() {
  return (
    <DarkModeProvider>
      <TenantProvider>
        <App />
      </TenantProvider>
    </DarkModeProvider>
  )
}
