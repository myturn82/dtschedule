# 스케줄 이미지 첨부 기능 설계

## 목표

스케줄 등록 시 이미지를 첨부할 수 있도록 커스텀 필드에 `image_upload` 타입을 추가한다.
클라이언트에서 압축·WebP 변환 후 Supabase Storage에 업로드하고, 기존 `assignments.extra_data`에 URL 배열을 저장한다.
DB 스키마 변경 없이 기존 구조를 최대한 재사용한다.

## 아키텍처

### 데이터 저장 방식

`assignments.extra_data` (JSONB, `Record<string, string>`)의 기존 구조를 유지한다.
이미지 업로드 필드의 값은 URL 배열을 JSON 직렬화한 문자열로 저장한다.

```
extra_data[fieldId] = '["https://.../img1.webp", "https://.../img2.webp"]'
```

파싱 시: `JSON.parse(extra_data[fieldId]) as string[]`

### Storage 경로

```
schedule-images/{tenantId}/{uuid}.webp
```

버킷은 public으로 설정한다. Public URL을 직접 사용하므로 서명 URL 불필요.

### 새 CustomFieldType

`'image_upload'`를 기존 union에 추가한다.

```typescript
type CustomFieldType =
  | 'text' | 'number' | 'select' | 'radio'
  | 'checkbox' | 'checkbox_group' | 'phone' | 'account_number'
  | 'image_upload'  // 신규
```

`CustomFieldDef`에 image_upload 전용 추가 필드는 없다. `required`, `label`만 사용.

## 이미지 압축 사양

| 항목 | 값 |
|------|-----|
| 최대 원본 크기 | 20MB (초과 시 선택 단계에서 즉시 차단) |
| 최대 해상도 | 1024px (긴 변 기준, 비율 유지) |
| 출력 포맷 | image/webp |
| 압축 품질 | 0.75 (75%) |
| 목표 용량 | 장당 500KB 이하 |
| 압축 방식 | HTML5 Canvas API (외부 라이브러리 없음) |
| 장당 최대 수 | 3장 |

## 파일 구성

### 신규 파일

| 파일 | 역할 |
|------|------|
| `src/lib/imageCompress.ts` | Canvas 기반 압축 유틸 함수 |
| `src/lib/uploadScheduleImage.ts` | Supabase Storage 업로드 함수 |
| `src/components/schedule/ImageUploadField.tsx` | 업로드 UI + 미리보기 컴포넌트 |
| `src/components/schedule/ImageGalleryModal.tsx` | 이미지 뷰어 라이트박스 |
| `supabase/migrations/056_storage_schedule_images.sql` | Storage RLS 정책 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/index.ts` | `CustomFieldType`에 `'image_upload'` 추가 |
| `src/components/setup/steps/Step7CustomFields.tsx` | 이미지첨부 필드 타입 옵션 추가 |
| `src/components/modals/SlotEditModal.tsx` | image_upload 렌더링, 등록 시 업로드 통합, 이미지 뷰어 연동 |
| `supabase/reset_db.sql` | Storage 정책 반영 |

## 컴포넌트 설계

### imageCompress.ts

```typescript
interface CompressResult {
  blob: Blob
  previewUrl: string   // objectURL (컴포넌트 언마운트 시 revoke 필요)
  originalKB: number
  compressedKB: number
}

async function compressImage(file: File): Promise<CompressResult>
```

- `file.size > 20 * 1024 * 1024` 이면 Error throw
- `Image` 로드 → Canvas resize (max 1024px, 비율 유지) → `toBlob('image/webp', 0.75)`
- `URL.createObjectURL(blob)`으로 previewUrl 생성

### uploadScheduleImage.ts

```typescript
async function uploadScheduleImage(
  tenantId: string,
  blob: Blob
): Promise<string>  // public URL 반환
```

- 경로: `schedule-images/${tenantId}/${crypto.randomUUID()}.webp`
- `supabase.storage.from('schedule-images').upload(path, blob, { contentType: 'image/webp' })`
- `supabase.storage.from('schedule-images').getPublicUrl(path).data.publicUrl` 반환
- 업로드 실패 시 Error throw

### ImageUploadField.tsx

Props:
```typescript
interface Props {
  fieldDef: CustomFieldDef
  value: string          // JSON 직렬화된 URL 배열 or ''
  onChange: (value: string) => void
  tenantId: string
  pendingImages: PendingImage[]
  onPendingChange: (images: PendingImage[]) => void
}

interface PendingImage {
  blob: Blob
  previewUrl: string
  originalKB: number
  compressedKB: number
}
```

상태 관리 방식:
- 기존 저장된 URL: `value`를 파싱한 `string[]` (부모에서 관리)
- 새로 추가된 이미지: `pendingImages` 배열 (부모 SlotEditModal에서 관리, 제출 시 업로드)
- 총 이미지 수: `existingUrls.length + pendingImages.length ≤ 3`

UI 구성:
- 이미지 추가 버튼 (총 3장 미만일 때만 활성)
- `isCompressing` 상태 → 로딩 스피너 표시
- 각 이미지: 썸네일 + 용량 표시 (예: "342KB → 87KB") + X 버튼
- 기존 이미지(URL 기반)와 신규 이미지(blob 기반) 동일 UI로 표시

### ImageGalleryModal.tsx

Props:
```typescript
interface Props {
  urls: string[]
  initialIndex?: number
  onClose: () => void
}
```

- 전체화면 오버레이
- 이전/다음 버튼 네비게이션
- 키보드 좌/우 화살표 지원
- ESC로 닫기

### SlotEditModal.tsx 수정

**renderFieldInput() 확장:**
- `type === 'image_upload'` → `ImageUploadField` 렌더링

**pending 이미지 상태 추가:**
```typescript
const [pendingImages, setPendingImages] = useState<Record<string, PendingImage[]>>({})
// key: fieldId
```

**등록/수정 제출 시 업로드 통합:**
```
1. pendingImages에 항목이 있으면:
   a. 각 blob을 uploadScheduleImage()로 업로드
   b. 반환된 URL들을 기존 existingUrls와 합쳐 JSON.stringify
   c. fieldValues[fieldId]에 저장
2. 기존 addAssignment / updateAssignment 호출
```

**기존 어사인먼트 표시 영역 (어사인먼트 목록):**
- image_upload 필드 값이 있으면 "🖼 이미지 N장" 뱃지 표시
- 클릭 시 `ImageGalleryModal` 오픈

## 데이터 흐름

```
유저 이미지 선택
  → compressImage() [Canvas API, WebP 변환]
  → pendingImages 상태에 추가
  → 썸네일 + 압축 전/후 용량 표시

유저 "등록" 클릭
  → pendingImages 순회, uploadScheduleImage() 호출
  → 업로드된 URL 수집
  → fieldValues[fieldId] = JSON.stringify([...existingUrls, ...newUrls])
  → addAssignment() / updateAssignment() 호출 (기존 흐름 유지)

기존 어사인먼트 조회
  → extra_data[fieldId] 파싱 → string[]
  → "🖼 이미지 N장" 뱃지
  → 클릭 → ImageGalleryModal
```

## 마이그레이션 (056)

Storage 버킷 및 RLS 정책을 SQL로 정의한다.
실제 버킷 생성은 Supabase 대시보드에서 수동으로 해야 한다 (아래 체크리스트 참조).

```sql
-- schedule-images 버킷 Storage RLS 정책
-- 인증된 사용자 업로드 허용
CREATE POLICY "authenticated_upload_schedule_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'schedule-images');

-- 공개 읽기 (public bucket이므로 선택적)
CREATE POLICY "public_read_schedule_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schedule-images');

-- 인증된 사용자 삭제 허용 (이미지 제거 기능)
CREATE POLICY "authenticated_delete_schedule_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'schedule-images');
```

## Supabase 수동 설정 체크리스트

구현 코드 적용 후 아래를 Supabase 대시보드에서 직접 수행해야 한다.

- [ ] Supabase 대시보드 → Storage → New Bucket
  - Name: `schedule-images`
  - Public bucket: ON (체크)
  - File size limit: 5MB (압축 후 기준)
  - Allowed MIME types: `image/webp,image/jpeg,image/png`
- [ ] Storage → Policies → `schedule-images` 버킷에 정책 확인
  - INSERT: authenticated 사용자 허용
  - SELECT: public 허용
  - DELETE: authenticated 사용자 허용
- [ ] SQL Editor에서 마이그레이션 056 실행 (dev DB 먼저)
- [ ] 운영 DB 반영 전 사용자 승인 확인

## 제약사항 및 예외 처리

- 원본 20MB 초과: 파일 선택 즉시 오류 토스트, 추가 불가
- 압축 실패 (Canvas 오류): 오류 토스트, 해당 파일만 스킵 (나머지 진행)
- 업로드 실패: 등록 전체 중단, 오류 메시지 표시 (`isSubmitting` false로 복구)
- WebP 미지원 브라우저: Canvas `toBlob` fallback → `image/jpeg` 으로 자동 전환
- `pendingImages` previewUrl: 컴포넌트 언마운트 시 `URL.revokeObjectURL()` 호출
- `show_in_dashboard`: image_upload 타입은 대시보드 집계 대상 제외 (Step7에서 옵션 미표시)
