interface Props {
  step: number   // 1-7
  total: number  // 7
}

export function WizardProgress({ step, total }: Props) {
  return (
    <div className="h-1 bg-[var(--color-surface-secondary)]">
      <div
        className="h-full bg-[var(--color-brand-primary)] transition-all duration-300"
        style={{ width: `${(step / total) * 100}%` }}
      />
    </div>
  )
}
