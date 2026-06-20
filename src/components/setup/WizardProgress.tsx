interface StepDef {
  label: string
  required: true | false | 'conditional'
}

interface Props {
  step: number
  steps: StepDef[]
  isFreeform: boolean
}

export function WizardProgress({ step, steps, isFreeform }: Props) {
  return (
    <div className="flex items-start justify-center gap-1 sm:gap-2 mb-6 overflow-x-auto py-1 px-1">
      {steps.map((s, i) => {
        const idx = i + 1
        const isDone = step > idx
        const isCurrent = step === idx
        return (
          <div key={idx} className="flex flex-col items-center gap-0.5 min-w-[2.25rem]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              isDone
                ? 'bg-[var(--color-brand-primary)] text-white'
                : isCurrent
                  ? 'bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-2 ring-[var(--color-brand-primary)]'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
            }`}>
              {isDone ? '✓' : idx}
            </div>
            <span className={`text-[9px] sm:text-[10px] leading-tight text-center whitespace-nowrap ${
              isCurrent ? 'text-[var(--color-brand-primary)] font-semibold' : 'text-[var(--color-text-muted)]'
            }`}>
              {s.label}
            </span>
            {s.required !== true && (
              <span className={`text-[8px] leading-none ${
                s.required === 'conditional' && isFreeform
                  ? 'text-orange-500 font-semibold'
                  : 'text-[var(--color-text-muted)]'
              }`}>
                {s.required === 'conditional' && isFreeform ? '필수' : '선택'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
