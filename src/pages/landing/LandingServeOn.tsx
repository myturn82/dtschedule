// src/pages/landing/LandingServeOn.tsx
import { LandingLayout } from './LandingLayout'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#4CAF50'

export function LandingServeOn() {
  return (
    <>
      <LandingLayout
        appName="SERVE:ON"
        tagline="봉사자 모집부터 배정·확인까지, 엑셀 없이 한 화면에"
        accentColor={ACCENT}
        verticalId="public-welfare"
      >
        <section style={{ padding: '0 24px 60px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: '🤝', title: '봉사자 명단 관리', desc: '가능 요일·자격·보유 차량 등 커스텀 필드로 봉사자 정보를 체계적으로 관리.' },
              { icon: '📆', title: '자동 배정', desc: '역할별 필요 인원을 설정하면 봉사자를 자동으로 배정. 수동 조정도 자유롭게.' },
              { icon: '🕐', title: '봉사 시간 집계', desc: '봉사자별 누적 시간 자동 계산. 인증서·수료증 발급 자료로 바로 활용.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign: 'center', padding: '0 24px 60px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>이런 곳에서 쓰고 있어요</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['복지관', '사회복지시설', '시민단체', '종교단체', '지자체', '도서관', '문화시설', '자원봉사센터'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '5px 12px', fontSize: 13 }}>{tag}</span>
            ))}
          </div>
        </section>
      </LandingLayout>
      <DevFileLabel file="LandingServeOn.tsx" />
    </>
  )
}
