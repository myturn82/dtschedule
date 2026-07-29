// src/pages/landing/LandingLessonOn.tsx
import { LandingLayout } from './LandingLayout'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#F2604E'

export function LandingLessonOn() {
  return (
    <>
      <LandingLayout
        appName="LESSON:ON"
        tagline="강사 혼자 다 챙기던 회원권 관리, 이제 문자 한 통이 대신합니다"
        accentColor={ACCENT}
        verticalId="lesson-sports"
      >
        {/* 앵커 기능 */}
        <section style={{ padding: '0 24px 60px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: '📋', title: '수강권 자동 소진', desc: '출석할 때마다 남은 횟수 자동 차감. 강사가 일일이 기록할 필요 없음.' },
              { icon: '📱', title: 'D-1 자동 문자', desc: '수업 하루 전 회원에게 자동으로 알림 문자. 노쇼를 줄여드립니다.' },
              { icon: '📊', title: '회원별 통계', desc: '회원별 출석률, 수강권 소진 추이를 한눈에. 엑셀 다운로드 지원.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '0 24px 60px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>이런 곳에서 쓰고 있어요</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['PT·헬스', '요가', '필라테스', '골프 레슨', '무술·격투기', '수영', '발레', '댄스'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '5px 12px', fontSize: 13 }}>{tag}</span>
            ))}
          </div>
        </section>
      </LandingLayout>
      <DevFileLabel file="LandingLessonOn.tsx" />
    </>
  )
}
