# Phase 1 동작 점검 체크리스트 (2026-07-30)

버티컬 멀티앱 시스템 Phase 1 구현 완료 후 검증 항목입니다.

## T01 feature_flags

- [ ] 슈퍼관리자 → 조직 드로어 → "기능 플래그" 섹션 표시 확인
- [ ] "레슨권/수강권" 체크박스 해제 → 해당 조직에서 레슨권 탭 숨김 확인 (AdminPage 탭 필터)
- [ ] DB에 `settings.feature_flags` 반영 확인 (Supabase 대시보드)

## T02 plan_limits + useTenantPlan

- [ ] plan_limits 테이블에 새 컬럼(max_members, max_lesson_types, sms_monthly, has_ads) 존재 확인
- [ ] tenants 테이블에 plan 컬럼('basic' 기본값) 존재 확인
- [ ] useTenantPlan() 훅이 에러 없이 import 가능 확인

## T03 verticalPresets

- [ ] verticalPresets.ts import → getPresetFromParam('lesson-sports') 반환값 확인

## T04 brandConfig + 빌드 스크립트

- [ ] npm run build:lesson-on 빌드 성공 (에러 없음)
- [ ] npm run build:shift-on 빌드 성공
- [ ] npm run build:serve-on 빌드 성공

## T05 셋업 위자드 딥링크

- [ ] /setup?vertical=lesson-sports 접속 → Step 2에서 '회원 개별' 자동 선택 확인
- [ ] /setup?vertical=food-retail 접속 → Step 2에서 '회원 공유' 자동 선택 확인
- [ ] /setup?vertical=public-welfare 접속 → Step 2에서 '비회원' 자동 선택 확인

## T06 랜딩페이지 & 위자드 배너

- [ ] npm run dev → http://localhost:5173 → 기존 DTS 랜딩 표시 (BRAND.vertical = generic)
- [ ] VITE_VERTICAL=lesson-sports 환경에서 LandingLessonOn 표시 확인
- [ ] 랜딩 "무료로 시작하기" 버튼 → /consent?vertical=lesson-sports 이동 확인
- [ ] /consent → 위자드 진입 → ?vertical 파라미터 전파 확인 (ConsentPage → SetupWizardPage)
- [ ] 배너 "LESSON:ON 추천 설정이 자동으로 적용되었습니다" 표시 확인 (SetupWizardPage Step 2)

## T07 전체 흐름 통합 테스트

- [ ] VITE_VERTICAL=lesson-sports npm run dev 실행
- [ ] 랜딩페이지의 "무료로 시작하기" 클릭
- [ ] ConsentPage 동의 후 "동의 및 계속하기" 클릭
- [ ] AuthPage 회원가입 진행
- [ ] 조직 생성 후 SetupWizardPage 진입 (vertical 파라미터 전파 확인)
- [ ] Step 2에서 LESSON:ON 추천 모드 자동 선택 확인

---

## 검증 완료 기준

| 항목 | 통과 조건 |
|------|---------|
| `?vertical=lesson-sports` 접속 | LESSON:ON 랜딩페이지 표시 |
| 랜딩 CTA 클릭 | 위자드 진입 + Step 2 모드 자동 설정 |
| 슈퍼관리자 feature_flags 토글 | DB 반영 + UI 즉시 반응 |
| `npm run build:lesson-on` | 에러 없이 dist/ 빌드 |
| `npm run build` (기본) | 기존 기능 회귀 없음 |
