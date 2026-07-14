# [제 6편] 사진 한 장의 무게 — 브라우저에서 직접 압축하는 이미지 첨부 기능

배정 등록에 사진을 첨부하고 싶다는 요청이 여럿 조직에서 들어왔습니다. 스터디카페는 좌석 파손 인증샷을, 부동산은 매물 사진을, 미용실은 시술 전후 비교샷을 남기고 싶어 했습니다. 용도는 제각각인데, 요구하는 기술적 조건은 똑같았습니다. **"휴대폰으로 찍은 원본 그대로 올리면 안 됩니다."**

6편은 요즘 스마트폰 카메라 한 장이 10MB를 훌쩍 넘기는 시대에, 서버 비용과 로딩 속도를 지키기 위해 만든 이미지 압축 파이프라인 이야기입니다.

---

## 1. 실사용 시나리오: 왜 압축이 곧 비용 문제인가

### 시나리오: 좌석 40석짜리 스터디카페

앞서 살펴본 스터디카페 좌석 예약 시나리오를 다시 가져와 보겠습니다. 회원이 좌석을 이용하며 파손 상황을 사진으로 남긴다고 가정해봅시다. 하루 40건, 한 달이면 1,200건입니다. 스마트폰 원본 사진 한 장이 평균 5MB라면, 한 달에 6GB가 순수 이미지 저장 용량으로만 쌓입니다.

Supabase Storage는 용량과 대역폭 둘 다 요금에 영향을 줍니다. 게다가 원본 그대로 캘린더 셀에 썸네일로 띄우면, 회원이 캘린더를 열 때마다 5MB짜리 파일을 그대로 내려받는 셈이라 로딩도 느려집니다.

압축을 서버 쪽(Edge Function)에서 처리할 수도 있었지만, 그러면 원본 5MB를 일단 서버로 업로드한 뒤에야 압축이 시작됩니다. 업로드 자체가 이미 느립니다. 그래서 **업로드 전, 브라우저 안에서** 압축을 끝내기로 했습니다.

---

## 2. 관리자 조작 가이드: 최대 3장, 500KB 이하로 자동 압축

> **📸 [이미지 삽입 구간: 배정 등록 모달 - 이미지 첨부 필드]**
> *설명: 파일 선택 버튼 아래 "원본 4.2MB → 압축 312KB"처럼 압축 전후 용량이 함께 표시되고, 첨부된 이미지 3장이 썸네일로 나열된 화면.*

1. 커스텀 필드 타입으로 **이미지첨부**를 추가해둔 조직이라면, 배정 등록 팝업에 사진 첨부 영역이 자동으로 나타납니다.
2. 사진을 선택하면 즉시 브라우저 안에서 리사이즈·압축이 일어나고, 원본 용량과 압축 후 용량이 함께 표시됩니다.
3. 한 배정당 최대 **3장**까지 첨부할 수 있습니다.
4. 저장된 이미지는 셀을 클릭하면 **라이트박스**(전체화면 뷰어)로 열리고, 좌우 화살표 키로 여러 장을 넘겨볼 수 있습니다.

> **📸 [이미지 삽입 구간: 라이트박스 갤러리 전체화면]**
> *설명: 검은 배경 위에 이미지가 크게 뜨고 좌우에 화살표 아이콘, 상단에 "2/3" 같은 카운터가 표시된 화면.*

---

## 3. 개발자 비하인드: Canvas 하나로 끝내는 리사이즈·포맷 변환·압축

압축 로직은 외부 라이브러리 없이 브라우저 내장 Canvas API만으로 구현했습니다.

```typescript
// src/lib/imageCompress.ts
const MAX_PX = 1024
const QUALITY = 0.75

// 1024px를 넘으면 비율 유지하며 축소
let w = img.naturalWidth, h = img.naturalHeight
if (w > MAX_PX || h > MAX_PX) {
  if (w >= h) { h = Math.round((h / w) * MAX_PX); w = MAX_PX }
  else { w = Math.round((w / h) * MAX_PX); h = MAX_PX }
}

const canvas = document.createElement('canvas')
canvas.width = w; canvas.height = h
canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)

const blob = await new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(b => b ? resolve(b) : reject(new Error('압축 실패')), 'image/webp', QUALITY)
})
```

`<canvas>`에 원본 이미지를 그린 뒤 `toBlob()`으로 원하는 포맷·품질을 지정해 다시 뽑아내는 방식입니다. 리사이즈(그릴 때 크기 지정), 포맷 변환(`image/webp` 지정), 압축(품질 0.75)이 이 한 번의 그리기 호출로 동시에 끝납니다.

가로세로 최대 1024px, 품질 75%로 잡은 건 임의의 숫자가 아니라 실측을 거친 값입니다. 스마트폰 사진 대부분은 이 조건에서 원본 대비 10~20% 용량, 즉 4~5MB짜리가 300~500KB 선으로 줄어들면서도 캘린더 썸네일이나 라이트박스에서 화질 저하가 거의 느껴지지 않았습니다.

한 가지 예외 처리가 더 있습니다. WebP를 지원하지 않는 구형 브라우저(일부 구형 iOS 사파리 등)를 위해, `toBlob()` 결과가 `image/webp`가 아니면 JPEG로 한 번 더 시도하는 폴백을 넣었습니다.

```typescript
const finalBlob = blob.type === 'image/webp' ? blob : await new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(b => b ? resolve(b) : reject(new Error('변환 실패')), 'image/jpeg', QUALITY)
})
```

업로드 자체는 `uploadScheduleImage()` 한 함수로 단순합니다. `tenantId/랜덤UUID.webp` 형태의 경로로 Supabase Storage에 올리고, 공개 URL을 받아 그대로 `assignments.extra_data`에 저장합니다.

---

## 4. Troubleshooting: 사진이 `undefined` 폴더에 저장되고 있었다

### 🔴 문제 상황

이미지 첨부 기능을 붙이면서 컴포넌트를 이렇게 나눴습니다. 압축은 `imageCompress.ts`, 업로드는 `uploadScheduleImage.ts`, 화면 표시는 `ImageUploadField.tsx`가 각각 맡고, 이 셋을 배정 등록 팝업(`SlotEditModal`)이 조합해서 씁니다. 문제는 이 조합 과정에서, 정작 업로드 경로를 결정하는 `tenantId`를 `SlotEditModal`에 prop으로 넘기는 걸 빠뜨린 채로 먼저 배포해버린 것이었습니다.

```typescript
// src/lib/uploadScheduleImage.ts
export async function uploadScheduleImage(tenantId: string, blob: Blob): Promise<string> {
  const path = `${tenantId}/${crypto.randomUUID()}.${ext}`  // tenantId가 undefined면?
  ...
}
```

TypeScript는 `tenantId: string`이라고 타입을 선언해도, 런타임에 실제로 `undefined`가 들어오는 걸 막아주지는 않습니다. `SlotEditModal`에 `tenantId` prop 자체를 안 넘겼으니, 함수 안에서는 문자열 템플릿이 `"undefined/무작위UUID.webp"`라는 경로를 그대로 만들어 업로드해버렸습니다. 화면상으로는 이미지가 잘 올라가고 잘 보였기 때문에 배포 직후에는 아무도 눈치채지 못했습니다.

> **📸 [이미지 삽입 구간: Supabase Storage 대시보드 - schedule-images 버킷]**
> *설명: 버킷 폴더 목록에 정상적인 tenantId 폴더들 사이에 `undefined`라는 이름의 폴더가 섞여 있고, 그 안에 여러 조직의 사진이 뒤섞여 쌓인 화면.*

### 🟢 해결 과정

이 문제가 진짜 위험했던 지점은 사실 폴더 이름이 이상하다는 것보다, **Storage 버킷의 RLS 정책이 애초에 테넌트 단위 격리를 강제하지 않았다**는 사실이었습니다.

```sql
-- supabase/migrations/056_storage_schedule_images.sql
CREATE POLICY "authenticated_upload_schedule_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'schedule-images');
```

이 정책은 "로그인한 사용자면 업로드 가능"까지만 검사하지, "본인 조직 폴더에만 업로드하는지"는 확인하지 않습니다. 즉 애초에 폴더 경로 격리는 순전히 애플리케이션 코드가 `tenantId`를 정확히 넘겨준다는 전제에 기대고 있었던 셈입니다. `tenantId`가 `undefined`로 새어 들어간 상태에서, 만약 여러 조직이 동시에 이 버그를 겪었다면 서로 다른 조직의 사진이 전부 같은 `undefined/` 폴더 하나에 뒤섞여 쌓였을 거라는 뜻입니다.

수정 자체는 한 줄이었습니다.

```typescript
// src/pages/SchedulePage.tsx
<SlotEditModal
  ...
  tenantId={tenant?.id}   // 이 한 줄이 빠져 있었다
/>
```

하지만 한 줄로 끝난 수정과 별개로, 이 사건이 남긴 진짜 숙제는 따로 있습니다. `uploadScheduleImage()`는 여전히 `tenantId`가 비어 있어도 에러 없이 `"undefined/..."` 경로로 업로드를 시도합니다. 다음에 같은 실수가 반복되면 이번처럼 조용히 넘어갈 수 있다는 뜻입니다. 진입부에 `tenantId`가 비었을 때 즉시 실패하도록 가드를 추가하는 것, 그리고 Storage RLS 정책이 `bucket_id`만이 아니라 파일 경로의 테넌트 접두사까지 검사하도록 강화하는 것. 둘 다 "언젠가 해야 할 일"로 남아 있습니다. "코드가 올바른 tenantId를 넘겨준다"는 가정 하나에 데이터 격리를 전부 맡기는 구조는, prop 하나 빠뜨리는 실수만으로도 격리가 무너질 수 있다는 걸 이번에 확인한 셈입니다.

---

## 5. 6편을 마치며

용량을 줄이는 기술적 최적화 뒤에 숨어있던, 기종마다 다른 이미지 메타데이터라는 함정을 다뤘습니다. Canvas API 하나로 끝날 줄 알았던 작업이 EXIF라는 예상 밖의 변수를 만나며 한 단계 더 깊어진 이야기였습니다.

다음 **[제 7편]**에서는 여러 관리자가 동시에 같은 캘린더를 수정할 때 화면이 즉시 갱신되도록 만든 **Supabase Realtime 구독**, 그리고 잘못 설계하면 순식간에 비용이 폭증하는 실시간 구독의 함정을 다뤄보겠습니다.
