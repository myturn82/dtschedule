interface Props {
  name: string
  title: string
  error: string
  onChange: (name: string, title: string) => void
}

export function Step1OrgName({ name, title, error, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Icon + header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl select-none">🏢</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">조직 이름을 알려주세요</h2>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm mx-auto">달력 화면 상단과 공유 링크에 표시됩니다.</p>
      </div>

      {/* Example callout */}
      <div className="rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-4 py-3">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">💡 예시</p>
        <p className="text-sm text-[var(--color-text-secondary)]">행복 자원봉사센터, ABC 헬스장, 홍길동 학원</p>
      </div>

      {/* Form */}
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

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
