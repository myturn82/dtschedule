import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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

const ROW_HEIGHT = 36
const MIN_VISIBLE_ROWS = 10
const MARGIN = 8
const MAX_DROPDOWN_WIDTH = 280

export function MemberSearchSelect({ value, onChange, options, placeholder = '이름으로 검색...', className = '', clearLabel }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number; maxWidth: number; maxHeight: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    // 모바일 키보드가 뜨면 visualViewport가 줄어들면서 window.innerHeight와 어긋남 —
    // 실제로 보이는 영역(visualViewport) 기준으로 계산해야 드롭다운이 키보드 위쪽에 붙는다
    const vv = window.visualViewport
    const visibleTop = vv?.offsetTop ?? 0
    const visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight
    const spaceBelow = visibleBottom - r.bottom - MARGIN
    const spaceAbove = r.top - visibleTop - MARGIN
    const desiredHeight = MIN_VISIBLE_ROWS * ROW_HEIGHT + 8
    const openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow
    const available = openUp ? spaceAbove : spaceBelow
    const height = Math.max(Math.min(available, desiredHeight), ROW_HEIGHT * 2)
    setPos({
      top: openUp ? r.top - height : r.bottom,
      left: r.left,
      minWidth: r.width,
      maxWidth: Math.min(window.innerWidth - r.left - MARGIN, Math.max(r.width, MAX_DROPDOWN_WIDTH)),
      maxHeight: height,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    // 모바일에서 키보드가 올라오는 애니메이션이 끝난 뒤 위치를 다시 계산
    const settleTimer = setTimeout(updatePosition, 300)
    const vv = window.visualViewport
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    vv?.addEventListener('resize', updatePosition)
    vv?.addEventListener('scroll', updatePosition)
    return () => {
      clearTimeout(settleTimer)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      vv?.removeEventListener('resize', updatePosition)
      vv?.removeEventListener('scroll', updatePosition)
    }
  }, [open, updatePosition])

  const sortedOptions = [...options].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const query = search.trim().toLowerCase()
  const filtered = query ? sortedOptions.filter(o => o.name.toLowerCase().includes(query)) : sortedOptions
  const selectedName = sortedOptions.find(o => o.id === value)?.name ?? ''

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value ? selectedName : search}
        onChange={e => { onChange(''); setSearch(e.target.value); setOpen(true) }}
        onFocus={() => { onChange(''); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && pos && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.minWidth, maxWidth: pos.maxWidth, maxHeight: pos.maxHeight }}
          className="z-[1000] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
        >
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
        </div>,
        document.body
      )}
    </div>
  )
}
