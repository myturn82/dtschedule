# 자동배정 기능 설계

## 개요
슈퍼어드민 · 테넌트 어드민이 현재 뷰(월/주/일) 기준으로 빈 스케줄 슬롯을 회원들에게 공평하게 자동 배정하는 기능.

## 제약 조건
- `tenantMode === '회원선택'`인 경우에만 활성화
- `isPrivileged` (superadmin | tenantAdmin) 에게만 표시
- **빈 슬롯만** 채움 (기존 배정 유지)
- 슬롯당 **1명** 배정
- 확인 모달에서 **개별 배정 취소** 가능 후 저장

## 배정 기간
| 뷰 | 대상 기간 |
|----|----------|
| 월 | 현재 `year, month` 전체 |
| 주 | `weekDays[0]` ~ `weekDays[6]` (월~일) |
| 일 | 현재 `day` 하루 |

## 알고리즘

### Split 모드 (splitRoles.length > 0)
각 `splitRole`에 대해:
1. `ProfileWithRole[]`에서 `tenantRoleId === role.id`인 멤버 추출
2. 해당 역할의 빈 슬롯 수집: open + 기존 `role_id === role.id` 배정 없음
3. 멤버를 현재 기간 배정 횟수 기준 오름차순 정렬
4. 라운드로빈으로 슬롯 ↔ 멤버 매핑

`indicatorBarRoles`도 동일 처리.

### 비 Split 모드
- `volunteer` 멤버 → `volunteer_type === 'volunteer'` 슬롯
- `50plus` 멤버 → `volunteer_type === '50plus'` 슬롯
- profile.role로 구분 (metadata 용도)

### 공평 분배 (Fairness)
```
sortedMembers = members.sort((a, b) => assignCount[a.id] - assignCount[b.id])
for i, slot in emptySlots:
  assign slot → sortedMembers[i % sortedMembers.length]
```

## 컴포넌트 설계

### `src/utils/autoAssign.ts`
순수 함수. DB 접근 없음.
```ts
function computeAutoAssignments(params): ProposedAssignment[]

interface ProposedAssignment {
  id: string          // 임시 uuid (미리보기 식별용)
  year, month, day
  timeSlot
  volunteerType
  roleId?: string | null
  userId
  userName
  roleName?: string   // 표시용
}
```

### `src/components/modals/AutoAssignPreviewModal.tsx`
```
Props:
  proposals: ProposedAssignment[]
  onConfirm: (selected: ProposedAssignment[]) => Promise<void>
  onClose: () => void
  loading: boolean

UI:
  - 테이블: 날짜 | 시간대 | 역할 | 회원 | [×] 체크박스
  - 체크 해제 → 해당 배정 제외
  - "총 N건 배정 예정" 카운터 (실시간 갱신)
  - [전체 저장] [취소]
```

### `src/pages/SchedulePage.tsx`
- "자동배정" 버튼 추가 (isPrivileged + 회원선택모드)
- `proposals` 상태 (`ProposedAssignment[] | null`)
- `autoAssignLoading` 상태
- 버튼 클릭 → `computeAutoAssignments()` → `proposals` 설정 → 모달 오픈
- 모달 confirm → 선택된 proposals를 `addAssignment()` 배치 실행

## 에러 처리
- 멤버 없음: "배정 가능한 회원이 없습니다" toast/alert
- 빈 슬롯 없음: "배정할 슬롯이 없습니다"
- 일부 저장 실패: 성공/실패 건수 표시

## 미포함 범위
- 배정 충돌 자동 재시도
- 멤버별 가중치/제외 설정
- 비 split + 역할 없는 경우의 tenantRole 기반 구분
