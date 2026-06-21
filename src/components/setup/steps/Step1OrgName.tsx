import { IndustryPicker } from '../../IndustryPicker'

interface Props {
  name: string
  title: string
  industry: string
  error: string
  onChange: (name: string, title: string, industry: string) => void
}

export function Step1OrgName({ name, title, industry, error, onChange }: Props) {
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)] transition-colors'

  return (
    <div className="space-y-6">
      {/* Icon + header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl select-none">🏢</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">조직을 소개해주세요</h2>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm mx-auto">달력 화면 상단과 공유 링크에 표시됩니다.</p>
      </div>

      {/* Industry picker */}
      <div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
          업종 <span className="text-red-500">*</span>
        </p>
        <IndustryPicker
          value={industry}
          onChange={v => onChange(name, title, v)}
          inputCls={inputCls}
          hideLabel
        />
      </div>

      {/* Org name + title */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            조직명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => onChange(e.target.value, title, industry)}
            placeholder="예: 행복 자원봉사 센터"
            maxLength={50}
            className={inputCls}
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
            onChange={e => onChange(name, e.target.value, industry)}
            placeholder={name || '달력 상단에 표시될 제목'}
            maxLength={50}
            className={inputCls}
          />
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
