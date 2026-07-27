import { useState } from 'react'

export interface MemberSearchOption {
  id: string
  name: string
}

interface Props {
  value: string
  onChange: (id: string) => void
  options: MemberSearchOption[]
  placeholder?: string
  className?: string
  clearLabel?: string
}

export function MemberSearchSelect({ value, onChange, options, placeholder = '이름으로 검색...', className = '', clearLabel }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const query = search.trim().toLowerCase()
  const filtered = query ? options.filter(o => o.name.toLowerCase().includes(query)) : options
  const selectedName = options.find(o => o.id === value)?.name ?? ''

  return (
    <div className="relative">
      <input
        value={value ? selectedName : search}
        onChange={e => { onChange(''); setSearch(e.target.value); setOpen(true) }}
        onFocus={() => { onChange(''); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && (
        <div className="absolute z-10 mt-1 w-max min-w-full max-w-[calc(100vw-2.5rem)] max-h-[60vh] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {clearLabel && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(''); setSearch(''); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] whitespace-nowrap"
            >
              {clearLabel}
            </button>
          )}
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[var(--color-text-muted)] whitespace-nowrap">일치하는 회원이 없습니다.</p>
          ) : (
            filtered.map(o => (
              <button
                type="button"
                key={o.id}
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(o.id); setSearch(''); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] whitespace-nowrap"
              >
                {o.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
