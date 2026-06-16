import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const stack: { id: number; file: string }[] = []
let counter = 0
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
function pushFile(id: number, file: string) {
  stack.push({ id, file })
  listeners.forEach(fn => fn())
}
function popFile(id: number) {
  const idx = stack.map(x => x.id).lastIndexOf(id)
  if (idx !== -1) stack.splice(idx, 1)
  listeners.forEach(fn => fn())
}

export function DevFileLabelDisplay() {
  const [, rerender] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => subscribe(() => rerender(n => n + 1)), [])

  const current = stack[stack.length - 1]?.file
  if (!import.meta.env.DEV || !current) return null

  function handleClick() {
    navigator.clipboard.writeText(current!).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return createPortal(
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[9999] pb-1">
      <button
        onClick={handleClick}
        className="text-[10px] font-mono bg-black/80 text-white px-3 py-1 rounded-full tracking-tight hover:bg-black transition-colors"
      >
        {copied ? '✓ copied' : current}
      </button>
    </div>,
    document.body
  )
}

// 페이지·모달에서 사용 — 렌더링 없이 스택에 등록만 함
export function DevFileLabel({ file }: { file: string }) {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const id = ++counter
    pushFile(id, file)
    return () => { popFile(id) }
  }, [file])
  return null
}
