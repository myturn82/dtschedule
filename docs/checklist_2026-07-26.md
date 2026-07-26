# 변경사항 점검 체크리스트 — 2026-07-26

## 작업 내용
- **전화번호 암호화 Phase 2 버그 수정** (migration 071·072)
- **Phase 3: extra_data phone 필드 암호화 + 문자 발송 버튼**

---

## 회원관리 (AdminPage) — 문자 보내기 버튼

### 모바일 카드 뷰
- [ ] 전화번호가 있는 회원 카드에 📱 아이콘이 표시된다
- [ ] 📱 탭 시 기기 기본 문자 앱이 해당 번호로 열린다
- [ ] 전화번호 없는 회원에는 📱 아이콘이 표시되지 않는다

### 데스크톱 테이블 뷰
- [ ] 전화번호 칸에 📱 아이콘이 수정 아이콘 옆에 표시된다
- [ ] 전화번호 편집 모드 진입 시 📱 아이콘이 사라진다 (편집 중이므로)
- [ ] 📱 클릭 시 기기 문자 앱 실행

### 모바일 확장 행 뷰
- [ ] 전화번호 행에 📱 아이콘이 표시된다
- [ ] 전화번호 편집 모드에서는 📱 아이콘이 표시되지 않는다

---

## 배정 모달 (SlotEditModal) — 문자 보내기 버튼

### customer_phone 표시
- [ ] 연락처 chip 옆에 📱 아이콘이 표시된다
- [ ] 📱 탭 시 해당 번호로 문자 앱 실행
- [ ] 번호가 없으면 📱 아이콘 미표시

### 동적 phone 타입 커스텀 필드
- [ ] phone 타입 필드의 값 chip 옆에 📱 아이콘이 표시된다
- [ ] 암호화된 값(`enc:...`)인 경우 `•••`로 표시되고 📱 아이콘은 미표시

---

## extra_data phone 필드 암호화

### 신규 배정 저장 (SlotEditModal)
- [ ] phone 타입 커스텀 필드에 번호 입력 후 저장 시 DB에 `enc:` 접두사로 저장된다
- [ ] SQL Editor에서 확인: `SELECT extra_data FROM assignments WHERE extra_data IS NOT NULL LIMIT 5;`

### 배정 수정 (SlotEditModal)
- [ ] 암호화된 phone 필드가 있는 배정을 수정하면 입력란이 빈 값으로 시작 후 복호화된 값으로 채워진다
- [ ] 수정 후 저장하면 다시 암호화되어 저장된다

### 빠른 예약 (QuickBookingModal)
- [ ] phone 타입 필드 입력 후 등록 시 DB에 `enc:` 접두사로 저장된다

---

## 문자 발송 모달 (SmsModal) — 기존 기능 회귀 방지

- [ ] 월간 스케줄에서 문자 발송 버튼 클릭 시 SmsModal 정상 오픈
- [ ] 암호화된 extra_data phone 값을 가진 회원의 번호가 복호화되어 표시된다
- [ ] 기존 plaintext phone 값은 그대로 표시된다
- [ ] 발송 버튼 클릭 시 문자 앱 실행

---

## 개발 DB 적용 필요

- [ ] Migration 073 개발 DB 반영:
  ```
  npx supabase db push --project-ref mcuszdvophmqrwostcah
  ```
- [ ] 기존 extra_data phone 필드 일괄 암호화 (SQL Editor에서 1회 실행):
  ```sql
  SELECT * FROM encrypt_extra_data_phone_fields();
  ```
