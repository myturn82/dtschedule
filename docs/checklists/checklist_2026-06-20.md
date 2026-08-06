# 변경사항 점검 체크리스트 — 2026-06-20

## 작업 내용
간편설정 위저드 진입 플로우 수정

### 수정 파일
- `src/pages/PendingPage.tsx` — handleCreateCustomer: customer/tenant/member 생성 후 `/setup?org=<id>` 이동, 비활성 customer 재사용 방지
- `src/contexts/AuthContext.tsx` — fetchProfile/refreshCustomer: 중복 customer 대비 `.order().limit(1).maybeSingle()`
- `src/components/modals/StartServiceModal.tsx` — onSuccess(tenantId) 시그니처 변경, 동일 플로우 적용
- `src/components/AppHeader.tsx` — onSuccess 콜백에서 `/setup?org=<id>` 로 이동

---

## 점검 항목

### A. 신규 사용자 — PendingPage 경로

- [ ] 회원가입 후 PendingPage 표시 확인
- [ ] "내 서비스 시작하기" 클릭 → 서비스명 + 전화번호 입력 폼 표시
- [ ] 서비스명, 전화번호 입력 후 "시작하기" 클릭
- [ ] `/setup?org=<id>` 로 이동하여 SetupWizardPage(조직 이름 입력) 표시 확인
- [ ] 전화번호 형식 오류 시 에러 메시지 표시 확인

### B. 기존 customer 보유 사용자 — CustomerAdminPage 경로

- [ ] 로그인 후 CustomerAdminPage 표시 확인
- [ ] "조직 추가" → 조직 생성 후 `/setup?org=<id>` 로 이동 확인

### C. SetupWizardPage 위저드 흐름

- [ ] Step 1: 조직명 입력 → 다음
- [ ] Step 2: 운영 모드 선택 → 다음
- [ ] Step 3: 타임슬롯 선택 → 다음
- [ ] Step 4: 역할 설정 → 다음
- [ ] Step 5: 스케줄 규칙 설정 → 다음
- [ ] Step 6: 범례 설정 → 다음
- [ ] Step 7: 커스텀 필드 → 완료
- [ ] 완료 화면(StepDone) 및 "스케줄 보러가기" 동작 확인

### D. 재시도 시나리오

- [ ] 이전 시도로 customer/tenant가 이미 존재할 때 재시도해도 정상 진입 확인
- [ ] 비활성(is_active=false) customer 존재 시 신규 customer 생성 후 정상 진행 확인
