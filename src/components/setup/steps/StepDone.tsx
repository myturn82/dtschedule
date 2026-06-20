interface Props {
  orgName: string
  slotCount: number
  roleCount: number
  modeName: string
  openDays: string
  shareUrl: string
  onGoSchedule: () => void
  onGoMembers: () => void
  onGoAdmin: () => void
}

export function StepDone({ orgName, slotCount, roleCount, modeName, openDays, shareUrl, onGoSchedule, onGoMembers, onGoAdmin }: Props) {
  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => alert('공유 링크가 복사됐습니다.\n' + shareUrl))
  }

  const summary = [
    { label: '운영 모드', value: modeName },
    { label: '시간 슬롯', value: `${slotCount}개` },
    { label: '역할', value: roleCount > 0 ? `${roleCount}개` : '없음' },
    { label: '운영 요일', value: openDays || '미설정' },
  ]

  return (
    <div className="space-y-6 text-center">
      <div className="text-5xl select-none">🎉</div>

      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">설정 완료!</h2>
        <p className="text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text-primary)]">{orgName}</span> 조직이 준비됐어요.
        </p>
      </div>

      {/* Summary */}
      <div className="text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] divide-y divide-[var(--color-border)]">
        {summary.map(row => (
          <div key={row.label} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-[var(--color-text-muted)]">{row.label}</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{row.value}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="space-y-2.5">
        <button
          onClick={onGoSchedule}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[var(--color-brand-primary)] text-white hover:brightness-95 transition-all shadow-sm"
        >
          📅 스케줄 보러가기
        </button>
        <button
          onClick={onGoMembers}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 transition-colors"
        >
          👤 회원 초대하기
        </button>
        <button
          onClick={copyShareUrl}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          🔗 공유 링크 복사
        </button>
        <button
          onClick={onGoAdmin}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          전체 관리자 설정 열기 →
        </button>
      </div>
    </div>
  )
}
