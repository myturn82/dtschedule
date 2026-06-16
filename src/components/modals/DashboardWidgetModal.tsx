import { useState } from 'react'
import { DevFileLabel } from '../DevFileLabel'
import type { CustomFieldDef, DashboardWidgetConfig, WidgetAggOp, WidgetChartType } from '../../types'

interface Props {
  customFields: CustomFieldDef[]
  existing?: DashboardWidgetConfig | null
  onSave: (config: DashboardWidgetConfig) => void
  onClose: () => void
}

const CHART_OPTIONS: { value: WidgetChartType; label: string; icon: string }[] = [
  { value: 'bar',   label: '막대 차트', icon: '▦' },
  { value: 'pie',   label: '파이 차트', icon: '◕' },
  { value: 'table', label: '표',        icon: '▤' },
]

export function DashboardWidgetModal({ customFields, existing, onSave, onClose }: Props) {
  const [title, setTitle]             = useState(existing?.title ?? '')
  const [groupByFieldId, setGroupBy]  = useState(existing?.groupByFieldId ?? '')
  const [aggOp, setAggOp]             = useState<WidgetAggOp>(existing?.aggregateOp ?? 'COUNT')
  const [aggFieldId, setAggFieldId]   = useState(existing?.aggregateFieldId ?? '')
  const [chartType, setChartType]     = useState<WidgetChartType>(existing?.chartType ?? 'bar')
  const [error, setError]             = useState('')

  // 그룹화에 적합한 필드 (선택형)
  const groupByFields = customFields.filter(f =>
    ['select', 'radio', 'checkbox', 'checkbox_group'].includes(f.type)
  )
  // SUM/AVG 가능한 숫자 필드
  const numFields = customFields.filter(f => f.type === 'number')

  function handleSave() {
    setError('')
    if (!title.trim()) { setError('위젯 제목을 입력하세요'); return }
    if (!groupByFieldId) { setError('집계 기준 필드를 선택하세요'); return }
    if ((aggOp === 'SUM' || aggOp === 'AVG') && !aggFieldId) {
      setError('합계/평균 대상 숫자 필드를 선택하세요'); return
    }
    onSave({
      id: existing?.id ?? crypto.randomUUID(),
      title: title.trim(),
      groupByFieldId,
      aggregateOp: aggOp,
      aggregateFieldId: aggOp !== 'COUNT' ? aggFieldId : undefined,
      chartType,
    })
  }

  const inputCls = 'h-9 border border-[var(--color-border)] rounded-lg px-3 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-primary)] w-full'

  const aggBtnCls = (active: boolean) =>
    `px-3 py-1.5 text-sm rounded-lg border transition-colors ${
      active
        ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
    }`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-[22px] shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          {existing ? '위젯 수정' : '통계 위젯 추가'}
        </h2>

        {/* 위젯 제목 */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">위젯 제목 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="예: 메뉴별 이용 횟수"
            className={inputCls}
          />
        </div>

        {/* 집계 기준 필드 (X축 / Group By) */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
            집계 기준 필드 (X축) *
          </label>
          {groupByFields.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              그룹화 가능한 필드가 없습니다. 커스텀 필드 탭에서 드롭다운·라디오·체크박스 필드를 추가하세요.
            </p>
          ) : (
            <select
              value={groupByFieldId}
              onChange={e => setGroupBy(e.target.value)}
              className={inputCls}
            >
              <option value="">-- 필드 선택 --</option>
              {groupByFields.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* 집계 방식 (Y축) */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">집계 방식 (Y축) *</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={aggBtnCls(aggOp === 'COUNT')}
              onClick={() => { setAggOp('COUNT'); setAggFieldId('') }}>
              건수 COUNT
            </button>
            {numFields.map(f => (
              <button key={f.id + '-sum'} type="button"
                className={aggBtnCls(aggOp === 'SUM' && aggFieldId === f.id)}
                onClick={() => { setAggOp('SUM'); setAggFieldId(f.id) }}>
                {f.label} 합계
              </button>
            ))}
            {numFields.map(f => (
              <button key={f.id + '-avg'} type="button"
                className={aggBtnCls(aggOp === 'AVG' && aggFieldId === f.id)}
                onClick={() => { setAggOp('AVG'); setAggFieldId(f.id) }}>
                {f.label} 평균
              </button>
            ))}
          </div>
          {numFields.length === 0 && (
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
              숫자 필드가 없으면 건수(COUNT)만 사용 가능합니다.
            </p>
          )}
        </div>

        {/* 차트 유형 */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">차트 유형</label>
          <div className="flex gap-2">
            {CHART_OPTIONS.map(ct => (
              <button key={ct.value} type="button"
                onClick={() => setChartType(ct.value)}
                className={`flex-1 py-2.5 text-sm rounded-xl border transition-colors flex flex-col items-center gap-1 ${
                  chartType === ct.value
                    ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <span className="text-xl select-none">{ct.icon}</span>
                <span className="text-xs font-medium">{ct.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleSave}
            className="flex-1 py-2.5 bg-[var(--color-brand-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-brand-primary-hover)] transition-colors">
            저장
          </button>
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 border border-[var(--color-border-strong)] rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors">
            취소
          </button>
        </div>
      </div>
      <DevFileLabel file="DashboardWidgetModal.tsx" />
    </div>
  )
}
