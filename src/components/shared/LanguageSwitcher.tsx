import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n'

interface Props {
  /** compact: 국기+코드만 표시 (헤더용), full: 국기+언어명 표시 (사이드바용) */
  variant?: 'compact' | 'full'
}

export function LanguageSwitcher({ variant = 'compact' }: Props) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)
    ?? SUPPORTED_LANGUAGES[0]

  function changeLang(code: SupportedLanguage) {
    i18n.changeLanguage(code)
    localStorage.setItem('dtschedule-lang', code)
    setOpen(false)
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-[13px] font-semibold hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors select-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none select-none">{current.flag}</span>
        {variant === 'full' ? (
          <span>{current.label}</span>
        ) : (
          <span className="uppercase text-[11px] font-bold tracking-wide">{current.code}</span>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 min-w-[130px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden z-[80]"
        >
          {SUPPORTED_LANGUAGES.map(lang => {
            const isActive = lang.code === i18n.language
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => changeLang(lang.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold transition-colors select-none ${
                  isActive
                    ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span>{lang.label}</span>
                {isActive && (
                  <svg className="ml-auto" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
