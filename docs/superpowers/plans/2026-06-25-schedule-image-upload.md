# 스케줄 이미지 첨부 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스케줄 등록 시 이미지(최대 3장)를 첨부할 수 있도록 커스텀 필드에 `image_upload` 타입을 추가하고, 클라이언트에서 WebP 압축 후 Supabase Storage에 업로드하여 스케줄 상세에서 이미지 뷰어로 확인할 수 있게 한다.

**Architecture:** `CustomFieldType`에 `'image_upload'`를 추가하고 `assignments.extra_data[fieldId]`에 URL 배열의 JSON 문자열을 저장한다. DB 스키마 변경 없이 기존 구조를 재사용하며, Canvas API로 클라이언트 압축(WebP, 1024px, 75%)을 수행한 뒤 Supabase Storage `schedule-images` 버킷에 업로드한다.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Supabase JS Client v2, HTML5 Canvas API

## Global Constraints

- 타입 체크: `npx tsc -b` (루트에서) — `npx tsc --noEmit` 는 무효
- 하드코딩 금지: 조직별 설정은 항상 DB/Context에서 읽어야 함
- 아이콘: 시스템 이모지 사용, CSS `color` 적용 금지, `select-none` 필수
- 이미지 최대 장수: 3장 (MAX_IMAGES = 3)
- 원본 크기 상한: 20MB (초과 시 즉시 오류)
- Canvas 압축 사양: image/webp, quality 0.75, max 1024px (비율 유지)
- 목표 용량: 장당 500KB 이하
- Storage 경로: `schedule-images/{tenantId}/{uuid}.webp`
- `extra_data[fieldId]` 저장 형식: `JSON.stringify(string[])` (URL 배열)
- 새 모달/페이지에 DevFileLabel 추가 필수 (단, `src/components/modals/` 외 위치는 제외)
- 개발 DB 먼저 적용, 운영 DB는 사용자 승인 후

---

### Task 1: 타입 확장 + imageCompress 유틸

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/imageCompress.ts`

**Interfaces:**
- Produces:
  - `CustomFieldType` union에 `'image_upload'` 추가 (기존 8개 → 9개)
  - `compressImage(file: File): Promise<CompressResult>`
  - `interface CompressResult { blob: Blob; previewUrl: string; originalKB: number; compressedKB: number }`

- [ ] **Step 1: types/index.ts 수정**

`src/types/index.ts` 36번째 줄의 `CustomFieldType`을 아래로 교체한다:

```typescript
export type CustomFieldType = 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'checkbox_group' | 'phone' | 'account_number' | 'image_upload'
```

- [ ] **Step 2: imageCompress.ts 생성**

`src/lib/imageCompress.ts`를 새로 만든다:

```typescript
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
```

- [ ] **Step 3: 타입 체크**

```
npx tsc -b
```

오류 없이 통과해야 한다.

- [ ] **Step 4: 커밋**

```
git add src/types/index.ts src/lib/imageCompress.ts
git commit -m "feat: CustomFieldType image_upload 추가 + imageCompress 유틸"
```

---

### Task 2: uploadScheduleImage 유틸 + Storage 마이그레이션

**Files:**
- Create: `src/lib/uploadScheduleImage.ts`
- Create: `supabase/migrations/056_storage_schedule_images.sql`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`
- Produces: `uploadScheduleImage(tenantId: string, blob: Blob): Promise<string>` — public URL 반환

- [ ] **Step 1: uploadScheduleImage.ts 생성**

`src/lib/uploadScheduleImage.ts`:

```typescript
import { supabase } from './supabase'

export async function uploadScheduleImage(tenantId: string, blob: Blob): Promise<string> {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${tenantId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('schedule-images')
    .upload(path, blob, { contentType: blob.type })

  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from('schedule-images').getPublicUrl(path)
  return data.publicUrl
}
```

- [ ] **Step 2: 마이그레이션 파일 생성**

`supabase/migrations/056_storage_schedule_images.sql`:

```sql
-- schedule-images 버킷 Storage RLS 정책
-- 버킷 자체는 Supabase 대시보드 또는 아래 INSERT로 생성한다
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'schedule-images',
  'schedule-images',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자 업로드 허용
DROP POLICY IF EXISTS "authenticated_upload_schedule_images" ON storage.objects;
CREATE POLICY "authenticated_upload_schedule_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'schedule-images');

-- 공개 읽기
DROP POLICY IF EXISTS "public_read_schedule_images" ON storage.objects;
CREATE POLICY "public_read_schedule_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schedule-images');

-- 인증된 사용자 삭제 허용
DROP POLICY IF EXISTS "authenticated_delete_schedule_images" ON storage.objects;
CREATE POLICY "authenticated_delete_schedule_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'schedule-images');
```

- [ ] **Step 3: 타입 체크**

```
npx tsc -b
```

- [ ] **Step 4: 커밋**

```
git add src/lib/uploadScheduleImage.ts supabase/migrations/056_storage_schedule_images.sql
git commit -m "feat: uploadScheduleImage 유틸 + Storage RLS 마이그레이션"
```

---

### Task 3: ImageUploadField 컴포넌트

**Files:**
- Create: `src/components/schedule/ImageUploadField.tsx`

**Interfaces:**
- Consumes:
  - `compressImage` from `src/lib/imageCompress.ts`
  - `CompressResult` from `src/lib/imageCompress.ts`
  - `CustomFieldDef` from `src/types/index.ts`
- Produces:
  - `export interface PendingImage { blob: Blob; previewUrl: string; originalKB: number; compressedKB: number }`
  - `export function ImageUploadField(props: Props): JSX.Element`
  - Props: `{ fieldDef: CustomFieldDef; existingUrls: string[]; onExistingChange: (urls: string[]) => void; pending: PendingImage[]; onPendingChange: (imgs: PendingImage[]) => void }`

- [ ] **Step 1: ImageUploadField.tsx 생성**

`src/components/schedule/ImageUploadField.tsx`:

```typescript
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
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[var(--color-brand-primary)]/40 group flex-shrink-0">
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
```

- [ ] **Step 2: 타입 체크**

```
npx tsc -b
```

오류 없이 통과해야 한다.

- [ ] **Step 3: 커밋**

```
git add src/components/schedule/ImageUploadField.tsx
git commit -m "feat: ImageUploadField 컴포넌트 (압축 미리보기 + 개별 삭제)"
```

---

### Task 4: ImageGalleryModal 컴포넌트

**Files:**
- Create: `src/components/schedule/ImageGalleryModal.tsx`

**Interfaces:**
- Produces: `export function ImageGalleryModal(props: { urls: string[]; initialIndex?: number; onClose: () => void }): JSX.Element`

- [ ] **Step 1: ImageGalleryModal.tsx 생성**

`src/components/schedule/ImageGalleryModal.tsx`:

```typescript
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
```

- [ ] **Step 2: 타입 체크**

```
npx tsc -b
```

- [ ] **Step 3: 커밋**

```
git add src/components/schedule/ImageGalleryModal.tsx
git commit -m "feat: ImageGalleryModal 라이트박스 (키보드 네비게이션 포함)"
```

---

### Task 5: WizardIcons + Step7CustomFields 수정

**Files:**
- Modify: `src/components/setup/WizardIcons.tsx`
- Modify: `src/components/setup/steps/Step7CustomFields.tsx`

**Interfaces:**
- Consumes: `WizardIconKey` (현재 `keyof typeof WizardIcon`)
- Produces: `WizardIcon.image` 추가; `FIELD_TYPE_DEFS`에 `image_upload` 항목 포함

- [ ] **Step 1: WizardIcons에 image 아이콘 추가**

`src/components/setup/WizardIcons.tsx` 55번째 줄 (`chart:` 항목) 바로 뒤에 `image:` 항목을 추가한다:

```typescript
  chart: mk(<><path d="M3 3v18h18" /><rect x={7} y={12} width={3} height={5} rx={0.6} /><rect x={12} y={8} width={3} height={9} rx={0.6} /><rect x={17} y={5} width={3} height={12} rx={0.6} /></>),
  image: mk(<><rect x={3} y={3} width={18} height={18} rx={2.5} /><circle cx={8.5} cy={8.5} r={1.5} /><path d="m21 15-5-5L5 21" /></>),
}
```

- [ ] **Step 2: Step7CustomFields — FIELD_TYPE_DEFS에 image_upload 추가**

`src/components/setup/steps/Step7CustomFields.tsx` 32번째 줄 `{ value: 'radio', ... }` 다음 줄에 추가한다. `FIELD_TYPE_DEFS` 배열의 마지막 항목 바로 앞(radio 항목 뒤)에 삽입:

기존:
```typescript
  { value: 'radio',          label: '라디오',   tone: 'amber',  icon: 'dot' },
]
```

변경 후:
```typescript
  { value: 'radio',          label: '라디오',   tone: 'amber',  icon: 'dot' },
  { value: 'image_upload',   label: '이미지첨부', tone: 'rose',   icon: 'image' },
]
```

- [ ] **Step 3: FieldPreview에 image_upload 케이스 추가**

`src/components/setup/steps/Step7CustomFields.tsx`의 `FieldPreview` 함수(37번째 줄)에 첫 번째 `if` 블록 앞에 삽입한다:

기존:
```typescript
function FieldPreview({ field }: { field: CustomFieldDef }) {
  if (field.type === 'text' || field.type === 'number' || field.type === 'phone' || field.type === 'account_number') {
```

변경 후:
```typescript
function FieldPreview({ field }: { field: CustomFieldDef }) {
  if (field.type === 'image_upload') {
    return (
      <div className="prev-input" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>📷</span>
        <span>이미지 첨부 (최대 3장, WebP 자동 압축)</span>
      </div>
    )
  }
  if (field.type === 'text' || field.type === 'number' || field.type === 'phone' || field.type === 'account_number') {
```

- [ ] **Step 4: FieldEditor에서 image_upload 타입 시 show_in_dashboard 숨기기 확인**

`FIELD_TYPES_WITH_DASHBOARD` (types/index.ts 41번째 줄)에는 `image_upload`가 없으므로 `hasDash`가 자동으로 `false`가 된다. 별도 수정 불필요.

- [ ] **Step 5: 타입 체크**

```
npx tsc -b
```

- [ ] **Step 6: 커밋**

```
git add src/components/setup/WizardIcons.tsx src/components/setup/steps/Step7CustomFields.tsx
git commit -m "feat: Step7 커스텀필드에 이미지첨부 타입 추가"
```

---

### Task 6: SlotEditModal 통합

**Files:**
- Modify: `src/components/modals/SlotEditModal.tsx`

**Interfaces:**
- Consumes:
  - `ImageUploadField`, `PendingImage` from `src/components/schedule/ImageUploadField.tsx`
  - `ImageGalleryModal` from `src/components/schedule/ImageGalleryModal.tsx`
  - `uploadScheduleImage` from `src/lib/uploadScheduleImage.ts`
  - `CustomFieldDef` (already imported)
- Produces: SlotEditModal accepts `tenantId?: string` prop; image fields work end-to-end

이 태스크는 SlotEditModal.tsx에 여러 변경을 가한다. 아래 단계를 순서대로 수행한다.

- [ ] **Step 1: import 추가**

파일 상단 import 블록에 3개 라인 추가:

```typescript
import { ImageUploadField } from '../schedule/ImageUploadField'
import type { PendingImage } from '../schedule/ImageUploadField'
import { ImageGalleryModal } from '../schedule/ImageGalleryModal'
import { uploadScheduleImage } from '../../lib/uploadScheduleImage'
```

- [ ] **Step 2: Props에 tenantId 추가**

`interface Props` 블록에서 `lockedUserId?: string` 줄 앞에 아래를 추가한다:

```typescript
  tenantId?: string
```

구조분해 할당(`export function SlotEditModal({ ... }:`)에도 `tenantId,`를 추가한다:

```typescript
export function SlotEditModal({
  target, cellState, profile, tenantRole, memberRoleId,
  splitRoles = [], isSplitMode = false, tenantRoles = [],
  tenantMode = '회원선택', customFields = [],
  slotLabels = {},
  typeLabels = { member: '팀원', '50plus': '' },
  tenantId,
  lockedUserId,
  onClose, onAdd, onUpdate, onDelete, onToggleLock, isHighlighted, onToggleHighlight,
}: Props) {
```

- [ ] **Step 3: 상태 변수 추가**

기존 `const [fieldValues, setFieldValues] = useState<Record<string, string>>({})` 줄 바로 다음에 추가:

```typescript
  const [pendingImages, setPendingImages] = useState<Record<string, PendingImage[]>>({})
  const [galleryUrls, setGalleryUrls] = useState<string[] | null>(null)
```

- [ ] **Step 4: resolveImageUploads 헬퍼 추가**

`startEdit` 함수 정의 바로 앞에 아래 함수를 추가한다:

```typescript
  async function resolveImageUploads(baseValues: Record<string, string>): Promise<Record<string, string>> {
    if (!tenantId) return baseValues
    const resolved = { ...baseValues }
    await Promise.all(
      customFields
        .filter(f => f.type === 'image_upload')
        .map(async f => {
          const pending = pendingImages[f.id] ?? []
          if (pending.length === 0) return
          const existing: string[] = (() => {
            try { return resolved[f.id] ? (JSON.parse(resolved[f.id]) as string[]) : [] } catch { return [] }
          })()
          const newUrls = await Promise.all(pending.map(img => uploadScheduleImage(tenantId, img.blob)))
          resolved[f.id] = JSON.stringify([...existing, ...newUrls])
        })
    )
    return resolved
  }
```

- [ ] **Step 5: cancelEdit에 pendingImages 클리어 추가**

기존 `cancelEdit` 함수를 아래로 교체한다:

```typescript
  function cancelEdit() {
    setEditingId(null)
    setNote('')
    setTimeSub(defaultTimeSub)
    setFieldValues({})
    Object.values(pendingImages).flat().forEach(img => URL.revokeObjectURL(img.previewUrl))
    setPendingImages({})
    setSelectedUserId(isAdmin ? '' : (profile?.id ?? ''))
  }
```

- [ ] **Step 6: isFieldFilled에 image_upload 케이스 추가**

기존 `isFieldFilled` 함수를 아래로 교체한다:

```typescript
  function isFieldFilled(field: CustomFieldDef): boolean {
    if (field.type === 'image_upload') {
      const hasExisting = (() => {
        try { return field.id in fieldValues && (JSON.parse(fieldValues[field.id]) as string[]).length > 0 } catch { return false }
      })()
      return hasExisting || (pendingImages[field.id]?.length ?? 0) > 0
    }
    const val = fieldValues[field.id] ?? ''
    if (field.type === 'checkbox') return val === 'true'
    return val.trim() !== ''
  }
```

- [ ] **Step 7: handleAdd 교체**

기존 `handleAdd` 함수 전체(152번째 줄 ~ 242번째 줄)를 아래로 교체한다:

```typescript
  async function handleAdd() {
    setError(null)
    let name: string
    let userId: string | undefined
    const customerPhone: string | null = null

    if (useDynamicFields) {
      for (const field of customFields) {
        if (field.required && !isFieldFilled(field)) { setError(`"${field.label}"은(는) 필수 항목입니다`); return }
        if (field.type === 'number') {
          const num = Number(fieldValues[field.id])
          if (fieldValues[field.id]?.trim() && field.min !== undefined && num < field.min) { setError(`"${field.label}"은(는) ${field.min} 이상이어야 합니다`); return }
          if (fieldValues[field.id]?.trim() && field.max !== undefined && num > field.max) { setError(`"${field.label}"은(는) ${field.max} 이하이어야 합니다`); return }
        }
        if (field.type === 'phone' && fieldValues[field.id]?.trim()) {
          if (!isValidPhone(fieldValues[field.id])) { setError(`"${field.label}"의 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)`); return }
        }
        if (field.type === 'account_number' && fieldValues[field.id]?.trim()) {
          if (fieldValues[field.id].replace(/\D/g, '').length < 8) { setError(`"${field.label}"의 계좌번호는 숫자 8자리 이상이어야 합니다`); return }
        }
      }
      const nameFieldId = customFields[0].id
      name = fieldValues[nameFieldId]?.trim() ?? ''
      if (!name) return
      if (isAdmin && isSplitMode && selectedUserId) userId = selectedUserId
    } else {
      if (!selectedProfile) return
      name = selectedProfile.name
      userId = isAdmin ? selectedProfile.id : undefined
    }

    if (showExtraCustomFields) {
      for (const field of customFields) {
        if (field.required && !isFieldFilled(field)) { setError(`"${field.label}"은(는) 필수 항목입니다`); return }
        if (field.type === 'number') {
          const num = Number(fieldValues[field.id])
          if (fieldValues[field.id]?.trim() && field.min !== undefined && num < field.min) { setError(`"${field.label}"은(는) ${field.min} 이상이어야 합니다`); return }
          if (fieldValues[field.id]?.trim() && field.max !== undefined && num > field.max) { setError(`"${field.label}"은(는) ${field.max} 이하이어야 합니다`); return }
        }
        if (field.type === 'phone' && fieldValues[field.id]?.trim()) {
          if (!isValidPhone(fieldValues[field.id])) { setError(`"${field.label}"의 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)`); return }
        }
        if (field.type === 'account_number' && fieldValues[field.id]?.trim()) {
          if (fieldValues[field.id].replace(/\D/g, '').length < 8) { setError(`"${field.label}"의 계좌번호는 숫자 8자리 이상이어야 합니다`); return }
        }
      }
    }

    if (cellState.isFull) {
      if (!isAdmin && !isFreeform) { setError('정원이 마감되었습니다'); return }
      if (!window.confirm(`정원(${cellState.maxCapacity}명)이 초과됩니다. 계속 추가하시겠습니까?`)) return
    }

    setLoading(true)

    // 이미지 업로드 처리
    let resolvedValues = fieldValues
    if (customFields.some(f => f.type === 'image_upload')) {
      try {
        resolvedValues = await resolveImageUploads(fieldValues)
      } catch (err) {
        setError(err instanceof Error ? err.message : '이미지 업로드 실패')
        setLoading(false)
        return
      }
    }

    // extraData 빌드
    let extraData: Record<string, string> | undefined
    if (useDynamicFields) {
      const rest: Record<string, string> = {}
      customFields.slice(1).forEach(f => {
        const v = resolvedValues[f.id]
        if (v !== undefined && v !== '') rest[f.id] = v.trim ? v.trim() : v
      })
      if (Object.keys(rest).length > 0) extraData = rest
    } else if (showExtraCustomFields) {
      const rest: Record<string, string> = {}
      customFields.forEach(f => {
        const v = resolvedValues[f.id]
        if (v !== undefined && v !== '') rest[f.id] = v.trim ? v.trim() : v
      })
      if (Object.keys(rest).length > 0) extraData = rest
    }

    const err = await onAdd(
      name,
      note.trim(),
      isFreeform ? 'member' : effectiveMemberType,
      timeSub,
      undefined,
      userId,
      isSplitMode ? selectedRoleId : undefined,
      null,
      customerPhone,
      extraData,
    )
    setLoading(false)
    if (err) { setError(err); return }
    // 업로드 완료 후 pending 클리어
    Object.values(pendingImages).flat().forEach(img => URL.revokeObjectURL(img.previewUrl))
    setPendingImages({})
    onClose()
  }
```

- [ ] **Step 8: handleUpdate 교체**

기존 `handleUpdate` 함수 전체(244번째 줄 ~ 326번째 줄)를 아래로 교체한다:

```typescript
  async function handleUpdate() {
    if (!editingId) return
    setError(null)
    let name: string
    const customerPhone: string | null = null

    if (useDynamicFields) {
      for (const field of customFields) {
        if (field.required && !isFieldFilled(field)) { setError(`"${field.label}"은(는) 필수 항목입니다`); return }
        if (field.type === 'number') {
          const num = Number(fieldValues[field.id])
          if (fieldValues[field.id]?.trim() && field.min !== undefined && num < field.min) { setError(`"${field.label}"은(는) ${field.min} 이상이어야 합니다`); return }
          if (fieldValues[field.id]?.trim() && field.max !== undefined && num > field.max) { setError(`"${field.label}"은(는) ${field.max} 이하이어야 합니다`); return }
        }
        if (field.type === 'phone' && fieldValues[field.id]?.trim()) {
          if (!isValidPhone(fieldValues[field.id])) { setError(`"${field.label}"의 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)`); return }
        }
        if (field.type === 'account_number' && fieldValues[field.id]?.trim()) {
          if (fieldValues[field.id].replace(/\D/g, '').length < 8) { setError(`"${field.label}"의 계좌번호는 숫자 8자리 이상이어야 합니다`); return }
        }
      }
      const nameFieldId = customFields[0].id
      name = fieldValues[nameFieldId]?.trim() ?? ''
      if (!name) return
    } else {
      if (!selectedProfile) return
      name = selectedProfile.name
    }

    if (showExtraCustomFields) {
      for (const field of customFields) {
        if (field.required && !isFieldFilled(field)) { setError(`"${field.label}"은(는) 필수 항목입니다`); return }
        if (field.type === 'number') {
          const num = Number(fieldValues[field.id])
          if (fieldValues[field.id]?.trim() && field.min !== undefined && num < field.min) { setError(`"${field.label}"은(는) ${field.min} 이상이어야 합니다`); return }
          if (fieldValues[field.id]?.trim() && field.max !== undefined && num > field.max) { setError(`"${field.label}"은(는) ${field.max} 이하이어야 합니다`); return }
        }
        if (field.type === 'phone' && fieldValues[field.id]?.trim()) {
          if (!isValidPhone(fieldValues[field.id])) { setError(`"${field.label}"의 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)`); return }
        }
        if (field.type === 'account_number' && fieldValues[field.id]?.trim()) {
          if (fieldValues[field.id].replace(/\D/g, '').length < 8) { setError(`"${field.label}"의 계좌번호는 숫자 8자리 이상이어야 합니다`); return }
        }
      }
    }

    setLoading(true)

    // 이미지 업로드 처리
    let resolvedValues = fieldValues
    if (customFields.some(f => f.type === 'image_upload')) {
      try {
        resolvedValues = await resolveImageUploads(fieldValues)
      } catch (err) {
        setError(err instanceof Error ? err.message : '이미지 업로드 실패')
        setLoading(false)
        return
      }
    }

    // extraData 빌드
    let extraData: Record<string, string> | undefined
    if (useDynamicFields) {
      const rest: Record<string, string> = {}
      customFields.slice(1).forEach(f => {
        const v = resolvedValues[f.id]
        if (v !== undefined && v !== '') rest[f.id] = v.trim ? v.trim() : v
      })
      if (Object.keys(rest).length > 0) extraData = rest
    } else if (showExtraCustomFields) {
      const rest: Record<string, string> = {}
      customFields.forEach(f => {
        const v = resolvedValues[f.id]
        if (v !== undefined && v !== '') rest[f.id] = v.trim ? v.trim() : v
      })
      if (Object.keys(rest).length > 0) extraData = rest
    }

    const err = await onUpdate(
      editingId,
      name,
      note.trim(),
      isFreeform ? 'member' : effectiveMemberType,
      timeSub,
      undefined,
      isSplitMode ? selectedRoleId : undefined,
      null,
      customerPhone,
      extraData,
    )
    setLoading(false)
    if (err) { setError(err); return }
    // 업로드 완료 후 pending 클리어
    Object.values(pendingImages).flat().forEach(img => URL.revokeObjectURL(img.previewUrl))
    setPendingImages({})
    cancelEdit()
  }
```

- [ ] **Step 9: renderFieldInput에 image_upload 케이스 추가**

기존 `renderFieldInput` 함수(377번째 줄) 맨 앞에 early return을 추가한다. 기존 코드:

```typescript
  function renderFieldInput(field: CustomFieldDef) {
    const val = fieldValues[field.id] ?? ''
    return (
```

변경 후:

```typescript
  function renderFieldInput(field: CustomFieldDef) {
    if (field.type === 'image_upload') {
      const existingUrls: string[] = (() => {
        try { return fieldValues[field.id] ? (JSON.parse(fieldValues[field.id]) as string[]) : [] } catch { return [] }
      })()
      return (
        <ImageUploadField
          key={field.id}
          fieldDef={field}
          existingUrls={existingUrls}
          onExistingChange={urls => setFieldValues(prev => ({ ...prev, [field.id]: JSON.stringify(urls) }))}
          pending={pendingImages[field.id] ?? []}
          onPendingChange={imgs => setPendingImages(prev => ({ ...prev, [field.id]: imgs }))}
        />
      )
    }
    const val = fieldValues[field.id] ?? ''
    return (
```

- [ ] **Step 10: 기존 어사인먼트 목록 — 이미지 뱃지 추가**

기존 어사인먼트 목록(600번째 줄 근처)의 `displayedAssignments.map(a => { ... }` 블록 안에서
`detailChips` 빌드 로직을 찾아 image_upload 필드를 skip하도록 수정하고, 이미지 뱃지용 데이터를 따로 수집한다.

`if (isFreeform)` 분기 안 `customFields.slice(1).forEach` 블록:

기존:
```typescript
                  if (useDynamicFields) customFields.slice(1).forEach(f => {
                    const val = a.extra_data?.[f.id]
                    if (!val) return
                    const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                    detailChips.push({ key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` })
                  })
```

변경 후:
```typescript
                  if (useDynamicFields) customFields.slice(1).forEach(f => {
                    if (f.type === 'image_upload') return
                    const val = a.extra_data?.[f.id]
                    if (!val) return
                    const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                    detailChips.push({ key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` })
                  })
```

`} else if (showExtraCustomFields)` 분기 안 `customFields.forEach`:

기존:
```typescript
                } else if (showExtraCustomFields) {
                  customFields.forEach(f => {
                    const val = a.extra_data?.[f.id]
                    if (!val) return
                    const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                    detailChips.push({ key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` })
                  })
                }
```

변경 후:
```typescript
                } else if (showExtraCustomFields) {
                  customFields.forEach(f => {
                    if (f.type === 'image_upload') return
                    const val = a.extra_data?.[f.id]
                    if (!val) return
                    const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                    detailChips.push({ key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` })
                  })
                }
```

그 다음, `detailChips` 빌드 블록 바로 다음에(if/else if 블록 바로 다음) 이미지 필드 수집 코드를 추가한다:

```typescript
                // 이미지 필드 별도 수집
                const imageChips: { fieldId: string; label: string; urls: string[] }[] = []
                const imgFieldSource = useDynamicFields ? customFields.slice(1) : showExtraCustomFields ? customFields : []
                imgFieldSource.forEach(f => {
                  if (f.type !== 'image_upload') return
                  const raw = a.extra_data?.[f.id]
                  if (!raw) return
                  try {
                    const urls = JSON.parse(raw) as string[]
                    if (urls.length > 0) imageChips.push({ fieldId: f.id, label: f.label, urls })
                  } catch {}
                })
```

- [ ] **Step 11: 이미지 뱃지 버튼 JSX 추가**

기존 어사인먼트 카드 JSX에서 `{detailChips.length > 0 && (...)}` 블록 다음에 이미지 뱃지 렌더링을 추가한다:

기존 (detailChips 렌더 블록 다음):
```tsx
                    {detailChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-dashed border-[var(--color-border-strong)]">
                        {detailChips.map(c => (
                          <span key={c.key} className="...">
                            <b ...>{c.label}</b>{c.value}
                          </span>
                        ))}
                      </div>
                    )}
```

변경 후 (detailChips 블록 내부 끝에 imageChips 버튼을 추가):
```tsx
                    {(detailChips.length > 0 || imageChips.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-dashed border-[var(--color-border-strong)]">
                        {detailChips.map(c => (
                          <span key={c.key} className="text-[11.5px] font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-2 py-1 rounded-lg inline-flex gap-1 whitespace-nowrap">
                            <b className="font-extrabold text-[var(--color-text-muted)]">{c.label}</b>{c.value}
                          </span>
                        ))}
                        {imageChips.map(ic => (
                          <button
                            key={ic.fieldId}
                            type="button"
                            onClick={() => setGalleryUrls(ic.urls)}
                            className="text-[11.5px] font-semibold text-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] border border-[var(--color-brand-primary)]/20 px-2 py-1 rounded-lg inline-flex items-center gap-1 whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--color-brand-primary)_15%,transparent)] transition-colors select-none"
                          >
                            <span className="select-none">🖼</span> {ic.label} {ic.urls.length}장
                          </button>
                        ))}
                      </div>
                    )}
```

- [ ] **Step 12: ImageGalleryModal 렌더링 추가**

`SlotEditModal`의 반환 JSX 맨 마지막 `</div>` (최상위 닫는 태그) 바로 앞, `<DevFileLabel ... />` 바로 앞에 추가한다:

```tsx
      {galleryUrls && (
        <ImageGalleryModal
          urls={galleryUrls}
          onClose={() => setGalleryUrls(null)}
        />
      )}
      <DevFileLabel file="SlotEditModal.tsx" />
    </div>
  )
```

- [ ] **Step 13: 타입 체크**

```
npx tsc -b
```

오류 없이 통과해야 한다. `image_upload` 관련 타입 오류가 있으면 수정한다.

- [ ] **Step 14: 커밋**

```
git add src/components/modals/SlotEditModal.tsx
git commit -m "feat: SlotEditModal 이미지 업로드 통합 (업로드/뷰어/편집)"
```

---

### Task 7: SchedulePage tenantId 연결 + reset_db.sql 갱신

**Files:**
- Modify: `src/pages/SchedulePage.tsx`
- Modify: `supabase/reset_db.sql`

**Interfaces:**
- Consumes: `tenant.id` (already available via `useTenant()` at line 85)
- Produces: SlotEditModal이 `tenantId` prop을 받아 이미지 업로드 동작

- [ ] **Step 1: SchedulePage에서 SlotEditModal에 tenantId prop 추가**

`src/pages/SchedulePage.tsx` 856번째 줄의 `<SlotEditModal` 블록에서
`lockedUserId={...}` 줄 바로 앞에 아래 줄을 추가한다:

```tsx
          tenantId={tenant?.id}
```

전체 prop 목록 중 `lockedUserId` 줄을 찾아서:

기존:
```tsx
          lockedUserId={tenantMode === '회원개별' && isPrivileged ? (filterMemberId ?? undefined) : undefined}
```

변경 후:
```tsx
          tenantId={tenant?.id}
          lockedUserId={tenantMode === '회원개별' && isPrivileged ? (filterMemberId ?? undefined) : undefined}
```

- [ ] **Step 2: reset_db.sql에 Storage 정책 추가**

`supabase/reset_db.sql`을 열어 "기준 마이그레이션" 주석을 `055 → 056`으로 업데이트하고,
파일 맨 끝(또는 STEP 6 RLS 정책 섹션)에 아래 블록을 추가한다:

```sql
-- ── STEP 10: Storage 버킷 및 정책 ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'schedule-images',
  'schedule-images',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated_upload_schedule_images" ON storage.objects;
CREATE POLICY "authenticated_upload_schedule_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'schedule-images');

DROP POLICY IF EXISTS "public_read_schedule_images" ON storage.objects;
CREATE POLICY "public_read_schedule_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schedule-images');

DROP POLICY IF EXISTS "authenticated_delete_schedule_images" ON storage.objects;
CREATE POLICY "authenticated_delete_schedule_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'schedule-images');
```

- [ ] **Step 3: 최종 타입 체크 및 빌드 확인**

```
npx tsc -b
```

오류 없이 통과해야 한다.

- [ ] **Step 4: 동작 확인 체크리스트**

개발 서버(`npm run dev`)를 실행하고 아래를 수동으로 확인한다:

1. **커스텀 필드 설정:** 테넌트 설정 → Step7 → 새 필드 추가 → 타입 드롭다운에 "이미지첨부" 항목이 보이는가?
2. **이미지첨부 필드 추가:** 저장 후 스케줄 등록 팝업을 열면 "📷 사진 추가" 버튼이 나타나는가?
3. **압축 미리보기:** 이미지 선택 시 썸네일과 압축 후 용량(KB)이 표시되는가?
4. **20MB 초과 가드:** 20MB 이상 파일 선택 시 오류 메시지가 표시되는가?
5. **등록:** 등록 버튼 클릭 시 Storage 업로드 후 어사인먼트가 저장되는가?
   - (마이그레이션 056을 개발 DB에 적용한 뒤 테스트)
6. **이미지 뱃지:** 이미지가 첨부된 어사인먼트 카드에 "🖼 이미지 N장" 버튼이 보이는가?
7. **뷰어:** 뱃지 클릭 시 `ImageGalleryModal`이 열리고 이전/다음 이동이 되는가?
8. **편집:** 어사인먼트 수정 시 기존 이미지 썸네일이 표시되고 X로 개별 삭제 가능한가?
9. **최대 3장 제한:** 4번째 사진 추가 버튼이 사라지는가?

- [ ] **Step 5: 커밋**

```
git add src/pages/SchedulePage.tsx supabase/reset_db.sql
git commit -m "feat: 스케줄 이미지 첨부 기능 완성 — SchedulePage tenantId 연결 + reset_db 갱신"
```

---

## Supabase 수동 설정 체크리스트 (코드 배포 후 필수)

아래 항목은 코드만으로 자동 적용되지 않으며, **Supabase 대시보드**에서 직접 수행해야 한다.

### 개발 DB (mcuszdvophmqrwostcah) — 먼저 적용

- [ ] Supabase 대시보드 → [개발 프로젝트] → SQL Editor
- [ ] `supabase/migrations/056_storage_schedule_images.sql` 내용을 붙여넣고 실행
- [ ] Storage → Buckets → `schedule-images` 버킷이 생성되었는지 확인 (public)
- [ ] Storage → Policies → `schedule-images` 버킷에 3개 정책 확인
  - `authenticated_upload_schedule_images` (INSERT)
  - `public_read_schedule_images` (SELECT)
  - `authenticated_delete_schedule_images` (DELETE)
- [ ] 스케줄 등록 + 이미지 첨부 실제 동작 확인
- [ ] Storage → Objects → `schedule-images/` 하위에 업로드된 파일 확인

### 운영 DB (bjnmaajhcmhxwonybnqc) — 사용자 명시적 승인 후

- [ ] 개발 DB에서 동작 확인 완료
- [ ] **사용자에게 운영 DB 반영 승인 요청** ← 절대 임의 적용 금지
- [ ] 승인 후 운영 DB SQL Editor에서 동일 마이그레이션 실행
- [ ] 운영 Storage 버킷 및 정책 확인
