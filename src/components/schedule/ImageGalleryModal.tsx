import { useEffect, useState } from 'react'

interface Props {
  urls: string[]
  initialIndex?: number
  onClose: () => void
}

export function ImageGalleryModal({ urls, initialIndex = 0, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, urls.length - 1))
      else if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0))
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [urls.length, onClose])

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/92 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl flex flex-col items-center gap-3"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-9 h-9 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m5 5 10 10M15 5 5 15"/>
          </svg>
        </button>

        <img
          src={urls[current]}
          alt={`이미지 ${current + 1}`}
          className="max-w-full max-h-[78vh] object-contain rounded-xl"
        />

        <p className="text-white/60 text-sm select-none">
          {current + 1} / {urls.length}
        </p>

        {urls.length > 1 && (
          <div className="flex gap-3">
            <button
              onClick={() => setCurrent(c => Math.max(c - 1, 0))}
              disabled={current === 0}
              className="px-5 py-2 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 disabled:opacity-30 transition-colors select-none"
            >
              ← 이전
            </button>
            <button
              onClick={() => setCurrent(c => Math.min(c + 1, urls.length - 1))}
              disabled={current === urls.length - 1}
              className="px-5 py-2 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 disabled:opacity-30 transition-colors select-none"
            >
              다음 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
