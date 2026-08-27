# 버티컬 웹앱 배포 체크리스트

> LESSON:ON(`lessonon.dtschedule.com`) 배포를 기준으로 작성한 절차.
> 새 버티컬을 웹에 추가할 때마다 이 문서를 따른다.

---

## 현황

| 버티컬 | 서브도메인 | .env 파일 | 빌드 스크립트 | 랜딩 페이지 | 웹 배포 |
|--------|-----------|-----------|--------------|------------|--------|
| LESSON:ON | `lessonon.dtschedule.com` | ✅ | ✅ | ✅ | ✅ 완료 |
| SHIFT:ON  | `shifton.dtschedule.com`  | ✅ | ✅ | ✅ | ✅ 완료 |
| SERVE:ON  | `serveon.dtschedule.com`  | ✅ | ✅ | ✅ | ✅ 완료 |
| CLASS:ON  | `classon.dtschedule.com`  | ❌ | ❌ | ❌ | ⬜ |
| WORK:ON   | `workon.dtschedule.com`   | ❌ | ❌ | ❌ | ⬜ |
| SALON:ON  | `salonon.dtschedule.com`  | ❌ | ❌ | ❌ | ⬜ |
| CARE:ON   | `careon.dtschedule.com`   | ❌ | ❌ | ❌ | ⬜ |

---

## A. SHIFT:ON / SERVE:ON 배포 (코드 준비 완료 — 배포만 하면 됨)

### A-1. 호스팅케이알 DNS CNAME 추가

호스팅케이알 → 도메인 관리 → `dtschedule.com` → DNS 관리

| 타입 | 호스트 | 값 |
|------|--------|-----|
| CNAME | `shifton` | `cname.vercel-dns.com` |
| CNAME | `serveon` | `cname.vercel-dns.com` |

DNS 전파 확인: https://dnschecker.org/#CNAME/shifton.dtschedule.com

---

### A-2. Vercel 프로젝트 생성

vercel.com/new → 같은 `dtschedule` 레포 Import

**SHIFT:ON**
- Project Name: `dtschedule-shifton`
- Build Command (Override ON): `npm run build:shift-on`
- Output Directory: `dist`

**SERVE:ON**
- Project Name: `dtschedule-serveon`
- Build Command (Override ON): `npm run build:serve-on`
- Output Directory: `dist`

**양쪽 프로젝트 공통 환경변수 추가:**

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://bjnmaajhcmhxwonybnqc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | 운영 Supabase → Settings → API → anon public |
| `VITE_FEEDBACK_URL` | `https://tally.so/r/kdgDeJ` |
| `VITE_VAPID_PUBLIC_KEY` | `.env.local`의 값 |

→ Deploy 클릭

> ⚠️ **Deploy 완료 후 도메인이 자동 연결되지 않는다.**
> 빌드가 성공해도 A-3 도메인 연결을 하지 않으면 서브도메인 접속 시 "사이트에 연결할 수 없음" 오류가 난다.
> 반드시 아래 A-3을 추가로 진행한다.

---

### A-3. Vercel 도메인 연결 (DNS 전파 후)

각 프로젝트 → **Settings → Domains → 도메인 입력 후 Add**

- `dtschedule-shifton` → `shifton.dtschedule.com` 추가
- `dtschedule-serveon` → `serveon.dtschedule.com` 추가

---

### A-4. Supabase Auth Redirect URLs 추가

Supabase → 운영 프로젝트(`bjnmaajhcmhxwonybnqc`) → Authentication → URL Configuration → Redirect URLs

```
https://shifton.dtschedule.com/**
https://serveon.dtschedule.com/**
```

---

### A-5. 접속 확인

- [ ] `shifton.dtschedule.com` → SHIFT:ON 랜딩 확인
- [ ] `serveon.dtschedule.com` → SERVE:ON 랜딩 확인

---

## B. 신규 버티컬 추가 (CLASS:ON / WORK:ON / SALON:ON / CARE:ON)

코드 준비가 먼저 필요하다. **Claude에게 아래 항목을 요청**하면 된다.

### B-1. 코드 준비 (Claude 작업)

- [ ] `.env.<vertical>` 파일 생성 (`VITE_VERTICAL`, `VITE_BRAND_NAME`, `VITE_BRAND_COLOR`, `VITE_BRAND_TAGLINE`, `VITE_APP_ID`)
- [ ] `package.json`에 `build:<vertical>`, `dev:<vertical>` 스크립트 추가
- [ ] `src/pages/landing/Landing<VerticalName>.tsx` 랜딩 페이지 생성
- [ ] `src/App.tsx` `LandingRouter`에 버티컬 조건 추가
- [ ] `scripts/generate-icon.js` `VERTICAL_ICONS` 맵에 아이콘 설정 추가
- [ ] 커밋 & 푸시

### B-2. 이후 절차

코드 준비 완료 후 위 **A-1 ~ A-5** 와 동일하게 진행.

| 버티컬 | 서브도메인 | Build Command |
|--------|-----------|--------------|
| CLASS:ON | `classon.dtschedule.com` | `npm run build:class-on` |
| WORK:ON  | `workon.dtschedule.com`  | `npm run build:work-on`  |
| SALON:ON | `salonon.dtschedule.com` | `npm run build:salon-on` |
| CARE:ON  | `careon.dtschedule.com`  | `npm run build:care-on`  |
