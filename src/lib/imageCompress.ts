const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024
const MAX_PX = 1024
const QUALITY = 0.75

export interface CompressResult {
  blob: Blob
  previewUrl: string
  originalKB: number
  compressedKB: number
}

function loadImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')) }
    img.src = url
  })
}

export async function compressImage(file: File): Promise<CompressResult> {
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error(`파일 크기가 20MB를 초과합니다 (${Math.round(file.size / 1024 / 1024)}MB)`)
  }

  const originalKB = Math.round(file.size / 1024)
  const img = await loadImg(file)

  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > MAX_PX || h > MAX_PX) {
    if (w >= h) { h = Math.round((h / w) * MAX_PX); w = MAX_PX }
    else { w = Math.round((w / h) * MAX_PX); h = MAX_PX }
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error('이미지 압축에 실패했습니다')),
      'image/webp',
      QUALITY,
    )
  })

  // WebP 미지원 브라우저 fallback: PNG가 나왔으면 JPEG으로 재시도
  const finalBlob = blob.type === 'image/webp' ? blob : await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다')),
      'image/jpeg',
      QUALITY,
    )
  })

  return {
    blob: finalBlob,
    previewUrl: URL.createObjectURL(finalBlob),
    originalKB,
    compressedKB: Math.round(finalBlob.size / 1024),
  }
}
