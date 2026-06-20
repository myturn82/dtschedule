import type { TenantMode } from '../../../types'

interface Props {
  mode: TenantMode
  saving: boolean
  error: string
  onChange: (mode: TenantMode) => void
  onNext: () => void
  onBack: () => void
}

const MODE_CARDS: {
  mode: TenantMode
  icon: string
  title: string
  desc: string
  examples: string
}[] = [
  {
    mode: '회원공유',
    icon: '👥',
    title: '회원 공유',
    desc: '여러 회원이 같은 시간대를 함께 신청합니다.',
    examples: '도서관, 자원봉사센터, 스터디그룹',
  },
  {
    mode: '회원개별',
    icon: '🗂️',
    title: '회원 개별',
    desc: '회원마다 전용 칸이 나뉘어 개별 관리됩니다.',
    examples: 'PT 트레이너, 코치, 부스 담당자별 관리',
  },
  {
    mode: '비회원',
    icon: '📋',
    title: '비회원 (예약·방문)',
    desc: '회원 등록 없이 방문자 정보를 직접 입력합니다.',
    examples: '미용실, 식당 예약, 병원, 방문 서비스',
  },
]

function MiniDiagram({ mode }: { mode: TenantMode }) {
  const base = 'border border-[var(--color-border)] rounded overflow-hidden flex items-stretch h-10 w-20'
  if (mode === '회원공유') return (
    <div className={`${base} flex-col gap-px p-1 bg-[var(--color-surface)] justify-center`}>
      <span className="text-[8px] font-semibold px-1 py-px rounded text-center" style={{ background: 'var(--tint-sun)', color: 'var(--tint-sun-ink)' }}>김민준</span>
      <span className="text-[8px] font-semibold px-1 py-px rounded text-center" style={{ background: 'var(--tint-sun)', color: 'var(--tint-sun-ink)' }}>이서연</span>
    </div>
  )
  if (mode === '회원개별') return (
    <div className={`${base}`}>
      <div className="flex-1 flex items-center justify-center text-[7px] font-semibold" style={{ background: 'var(--tint-sun)', color: 'var(--tint-sun-ink)' }}>역할A</div>
      <div className="flex-1 flex items-center justify-center text-[7px] font-semibold border-l border-dashed border-[var(--color-border)]" style={{ background: 'oklch(0.96 0.03 55)', color: 'oklch(0.45 0.12 55)' }}>역할B</div>
    </div>
  )
  return (
    <div className={`${base} flex-col justify-center gap-0.5 p-1.5 bg-[var(--color-surface)]`}>
      <span className="text-[8px] text-[var(--color-text-muted)] text-center">📝 이름</span>
      <span className="text-[7px] text-[var(--color-text-muted)] text-center">연락처</span>
    </div>
  )
}

export function Step2Mode({ mode, saving, error, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">운영 방식을 선택하세요</h2>
        <p className="text-sm text-[var(--color-text-muted)]">나중에 관리자 설정에서 변경할 수 있습니다.</p>
      </div>

      <div className="space-y-3">
        {MODE_CARDS.map(card => (
          <button
            key={card.mode}
            onClick={() => onChange(card.mode)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
              mode === card.mode
                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5'
                : 'border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            <div className="flex gap-3 items-start">
              <div className="shrink-0">
                <MiniDiagram mode={card.mode} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl select-none">{card.icon}</span>
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">{card.title}</span>
                  {mode === card.mode && (
                    <span className="ml-auto text-[var(--color-brand-primary)] text-base shrink-0">✓</span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-snug">{card.desc}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">예: {card.examples}</p>
              </div>
            </div>
            {card.mode === '비회원' && mode === '비회원' && (
              <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-xs text-orange-600 dark:text-orange-400">
                ⚠ 7단계(커스텀필드)에서 방문자 수집 정보를 설정해야 합니다.
              </div>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
          ← 이전
        </button>
        <button onClick={onNext} disabled={saving} className="flex-[2] py-3 rounded-xl font-semibold text-sm bg-[var(--color-brand-primary)] text-white disabled:opacity-40 hover:brightness-95 transition-all">
          {saving ? '저장 중...' : '다음 →'}
        </button>
      </div>
    </div>
  )
}
