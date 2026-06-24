import { useRef, useState } from 'react'
import type { CustomFieldDef } from '../../types'
import { compressImage } from '../../lib/imageCompress'

export interface PendingImage {
  blob: Blob
  previewUrl: string
  originalKB: number
  compressedKB: number
}

interface Props {
  fieldDef: CustomFieldDef
  existingUrls: string[]
  onExistingChange: (urls: string[]) => void
  pending: PendingImage[]
  onPendingChange: (imgs: PendingImage[]) => void
}

const MAX_IMAGES = 3

export function ImageUploadField({ fieldDef, existingUrls, onExistingChange, pending, onPendingChange }: Props) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressError, setCompressError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalCount = existingUrls.length + pending.length
  const canAdd = totalCount < MAX_IMAGES && !isCompressing

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const canAddCount = MAX_IMAGES - totalCount
    const toProcess = files.slice(0, canAddCount)

    setIsCompressing(true)
    setCompressError(null)

    const results: PendingImage[] = []
    for (const file of toProcess) {
      try {
        const result = await compressImage(file)
        results.push(result)
      } catch (err) {
        setCompressError(err instanceof Error ? err.message : '압축 실패')
      }
    }

    if (results.length > 0) {
      onPendingChange([...pending, ...results])
    }
    setIsCompressing(false)
  }

  function removePending(idx: number) {
    URL.revokeObjectURL(pending[idx].previewUrl)
    onPendingChange(pending.filter((_, i) => i !== idx))
  }

  function removeExisting(idx: number) {
    onExistingChange(existingUrls.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
        {fieldDef.label}
        {fieldDef.required && <span className="text-red-500 ml-0.5">*</span>}
        <span className="ml-1 font-normal">({totalCount}/{MAX_IMAGES}장)</span>
      </label>

      {(existingUrls.length > 0 || pending.length > 0) && (
        <div className="flex gap-2 flex-wrap mb-2">
          {existingUrls.map((url, i) => (
            <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-border-strong)] group flex-shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity select-none"
                aria-label="삭제"
              >
                ×
              </button>
            </div>
          ))}
          {pending.map((img, i) => (
            <div key={img.previewUrl} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[var(--color-brand-primary)]/40 group flex-shrink-0">
              <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePending(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity select-none"
                aria-label="삭제"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">
                {img.compressedKB}KB
              </div>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-10 border-2 border-dashed border-[var(--color-border-strong)] rounded-xl text-xs font-medium text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="text-base select-none">📷</span>
            사진 추가 ({MAX_IMAGES - totalCount}장 가능)
          </button>
        </>
      )}

      {isCompressing && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1.5 flex items-center gap-1">
          <span className="inline-block animate-spin select-none">⏳</span> 이미지 최적화 중...
        </p>
      )}

      {compressError && (
        <p className="text-xs text-red-500 mt-1.5">{compressError}</p>
      )}
    </div>
  )
}
