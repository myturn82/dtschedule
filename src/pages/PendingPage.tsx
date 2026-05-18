import { useAuth } from '../hooks/useAuth'

export function PendingPage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">승인 대기 중</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {profile?.name ? `${profile.name}님, ` : ''}아직 소속된 조직이 없습니다.
          <br />관리자의 승인을 기다려 주세요.
        </p>
        <button
          onClick={signOut}
          className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
