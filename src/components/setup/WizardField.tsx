import type { ReactNode } from 'react'
import { WizardIcon } from './WizardIcons'

export function Field({ label, req, hint, children }: { label: string; req?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className="wfield">
      <label className="wlabel">{label}{req && <span className="wreq">*</span>}{hint && <span className="whint">{hint}</span>}</label>
      {children}
    </div>
  )
}

export function ErrLine({ error }: { error?: string | null }) {
  if (!error) return null
  return <p className="err-line"><WizardIcon.warn size={14} /> {error}</p>
}
