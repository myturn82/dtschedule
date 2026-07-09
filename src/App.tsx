import { useRef, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PlanLimitsProvider } from './contexts/PlanLimitsContext'
import { TenantProvider, useTenant } from './contexts/TenantContext'
import { useAuth } from './hooks/useAuth'
import { useCustomerAdmin } from './hooks/useCustomerAdmin'
import { SchedulePage } from './pages/SchedulePage'
import { SharePage } from './pages/SharePage'
import { EmbedPage } from './pages/EmbedPage'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { TenantSelectPage } from './pages/TenantSelectPage'
import { PendingPage } from './pages/PendingPage'
import { SuperAdminPage } from './pages/SuperAdminPage'
import { CustomerAdminPage } from './pages/CustomerAdminPage'
import { LandingPage }  from './pages/LandingPage'
import { ConsentPage }  from './pages/ConsentPage'
import { AuthPage }     from './pages/AuthPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SetupWizardPage } from './pages/SetupWizardPage'
import { HelpPage } from './pages/HelpPage'
import { DarkModeProvider } from './contexts/DarkModeContext'
import { InstallBanner } from './components/InstallBanner'
import { DevFileLabelDisplay } from './components/DevFileLabel'

function AppRoutes() {
  const { profile, loading: authLoading } = useAuth()
  const { isCustomerAdmin } = useCustomerAdmin()
  const { tenant, tenantRole, tenantPlan, memberships, loading: tenantLoading, tenantSelectedByUser } = useTenant()

  // 로그인 직후 슈퍼관리자는 조직 선택 화면 대신 슈퍼관리자 어드민으로 바로 이동
  const justLoggedInRef = useRef(sessionStorage.getItem('vs_just_logged_in') === '1')
  useEffect(() => {
    sessionStorage.removeItem('vs_just_logged_in')
  }, [])

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-[var(--color-text-secondary)] text-sm">로딩 중...</div>
      </div>
    )
  }

  // 신규 가입 후 setup 페이지로 이동하는 짧은 구간 — SIGNED_IN 이벤트로 인한 라우팅 깜빡임 방지
  if (sessionStorage.getItem('vs_setup_creating') === '1' && window.location.pathname !== '/setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-[var(--color-text-secondary)] text-sm">로딩 중...</div>
      </div>
    )
  }

  // ── 비인증 사용자: 공개 라우트 ─────────────────────────────────────────
  if (!profile) {
    return (
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/auth"           element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/share"          element={<SharePage />} />
        <Route path="/embed"          element={<EmbedPage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // 승인된 조직이 없으면 PendingPage (슈퍼관리자, 고객관리자 제외)
  // memberships는 TenantContext에서 이미 is_approved=true만 필터됨
  if (profile && memberships.length === 0 && !profile.is_super_admin && !isCustomerAdmin) {
    return (
      <Routes>
        <Route path="/share" element={<SharePage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="/superadmin" element={<SuperAdminPage />} />
        <Route path="/setup" element={<SetupWizardPage />} />
        <Route path="*" element={<PendingPage />} />
      </Routes>
    )
  }

  // Logged-in user with multiple memberships and no tenant selected yet → org picker
  // Super admins can still navigate directly to /superadmin or /admin
  if (profile && memberships.length > 1 && !tenant && !profile.is_super_admin) {
    return (
      <Routes>
        <Route path="/share" element={<SharePage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="/superadmin" element={<SuperAdminPage />} />
        <Route path="*" element={<TenantSelectPage />} />
      </Routes>
    )
  }

  // Super admin who hasn't explicitly selected a tenant → org picker (shows all tenants)
  // 단, 로그인 직후라면 조직 선택 화면을 건너뛰고 슈퍼관리자 어드민으로 바로 이동
  if (profile?.is_super_admin && !tenantSelectedByUser) {
    return (
      <Routes>
        <Route path="/share" element={<SharePage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="/superadmin" element={<SuperAdminPage />} />
        <Route path="/customer-admin" element={<CustomerAdminPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={
          justLoggedInRef.current ? <Navigate to="/superadmin" replace /> : <TenantSelectPage />
        } />
      </Routes>
    )
  }

  // Customer admin who hasn't selected a tenant → customer admin page
  if (isCustomerAdmin && !tenantSelectedByUser) {
    return (
      <Routes>
        <Route path="/share" element={<SharePage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="/setup" element={<SetupWizardPage />} />
        <Route path="/customer-admin" element={<CustomerAdminPage />} />
        <Route path="*" element={<CustomerAdminPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={
        <Navigate to="/schedule" replace />
      } />
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/dashboard" element={
        (tenantRole === 'admin' || profile?.is_super_admin || isCustomerAdmin) &&
        (profile?.is_super_admin || isCustomerAdmin || tenantPlan === 'business')
          ? <DashboardPage />
          : <Navigate to="/" replace />
      } />
      <Route path="/share" element={<SharePage />} />
      <Route path="/embed" element={<EmbedPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/setup" element={<SetupWizardPage />} />
      <Route path="/select-org" element={<TenantSelectPage />} />
      <Route path="/pending" element={<PendingPage />} />
      <Route path="/superadmin" element={
        profile?.is_super_admin ? <SuperAdminPage /> : <Navigate to="/" replace />
      } />
      <Route path="/customer-admin" element={
        isCustomerAdmin || profile?.is_super_admin ? <CustomerAdminPage /> : <Navigate to="/" replace />
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PlanLimitsProvider>
            <TenantProvider>
              <AppRoutes />
              <InstallBanner />
              <DevFileLabelDisplay />
            </TenantProvider>
          </PlanLimitsProvider>
        </AuthProvider>
      </BrowserRouter>
    </DarkModeProvider>
  )
}
