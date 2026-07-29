// src/pages/landing/LandingShiftOn.tsx
import { LandingLayout } from './LandingLayout'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#2E7D32'

export function LandingShiftOn() {
  return (
    <>
      <LandingLayout
        appName="SHIFT:ON"
        tagline="알바 스케줄 짜는 데 30분? 이제 5분이면 됩니다"
        accentColor={ACCENT}
        verticalId="food-retail"
      >
        <section style={{ padding: '0 24px 60px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: '🗓️', title: '드래그로 시프트 배정', desc: '이름 칸에 직원을 드래그해 떨어뜨리면 즉시 배정. 역할별 색상으로 한눈에.' },
              { icon: '🔔', title: '알바 자동 알림', desc: '출근 하루 전에 해당 직원에게 자동 문자 발송. 연락 잊어도 걱정 없음.' },
              { icon: '🕐', title: '근무 시간 집계', desc: '월별 직원별 총 근무 시간 자동 계산. 급여 정산 자료로 바로 사용.' },
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
            {['카페', '음식점', '편의점', '베이커리', '마트', '소매점', '호텔', '주점'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '5px 12px', fontSize: 13 }}>{tag}</span>
            ))}
          </div>
        </section>
      </LandingLayout>
      <DevFileLabel file="LandingShiftOn.tsx" />
    </>
  )
}
