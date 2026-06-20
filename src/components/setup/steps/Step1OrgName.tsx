interface Props {
  name: string
  title: string
  saving: boolean
  error: string
  onChange: (name: string, title: string) => void
  onNext: () => void
}

export function Step1OrgName({ name, title, saving, error, onChange, onNext }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">조직 이름을 알려주세요</h2>
        <p className="text-sm text-[var(--color-text-muted)]">달력 상단과 공유 링크에 표시됩니다.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            조직명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => onChange(e.target.value, title)}
            placeholder="예: 행복 자원봉사 센터"
            maxLength={50}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)] transition-colors"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            페이지 제목 <span className="text-xs font-normal text-[var(--color-text-muted)]">(선택 — 기본값: 조직명)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => onChange(name, e.target.value)}
            placeholder={name || '달력 상단에 표시될 제목'}
            maxLength={50}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)] transition-colors"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={onNext}
        disabled={!name.trim() || saving}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-[var(--color-brand-primary)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-95 transition-all"
      >
        {saving ? '저장 중...' : '다음 →'}
      </button>
    </div>
  )
}
