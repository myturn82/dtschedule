import type { TenantMode } from '../types'
import type { FeatureFlags } from './featureFlags'

export type VerticalId =
  | 'lessonon'
  | 'classon'
  | 'shifton'
  | 'salonon'
  | 'careon'
  | 'serveon'
  | 'workon'

export interface VerticalPreset {
  id:                   VerticalId
  appName:              string
  tagline:              string
  tenant_mode:          TenantMode
  allowed_modes?:       TenantMode[]  // undefined = 전체 허용
  feature_flags:        FeatureFlags
  default_roles:        string[]
  custom_field_presets: string[]
  theme_preset:         string
  industry_categories:  string[]  // 이 버티컬에서 선택 가능한 업종 대분류
}

export const VERTICAL_PRESETS: Record<VerticalId, VerticalPreset> = {
  'lessonon': {
    id:           'lessonon',
    appName:      'LESSON:ON',
    tagline:      '강사 혼자 다 챙기던 회원권 관리, 이제 문자 한 통이 대신합니다',
    tenant_mode:  '회원개별',
    allowed_modes: ['회원개별', '회원공유'],
    feature_flags: { lesson_packages: true, autoassign: true, notifications: true },
    default_roles: ['강사', '회원'],
    custom_field_presets: ['lesson_type', 'injury_history', 'goal'],
    theme_preset: 'salmon',
    industry_categories: ['스포츠·레저', '교육', '뷰티·헬스', '기타'],
  },
  'classon': {
    id:           'classon',
    appName:      'CLASS:ON',
    tagline:      '수강권 차감부터 출석까지, 학원 원장님의 잔업을 줄여드립니다',
    tenant_mode:  '회원개별',
    allowed_modes: ['회원개별'],
    feature_flags: { lesson_packages: true, autoassign: true, attendance: true },
    default_roles: ['강사', '학생'],
    custom_field_presets: ['school', 'grade', 'subject', 'parent_contact'],
    theme_preset: 'midnight',
    industry_categories: ['교육', '스포츠·레저', '기타'],
  },
  'shifton': {
    id:           'shifton',
    appName:      'SHIFT:ON',
    tagline:      '알바 스케줄 짜는 데 30분? 이제 5분이면 됩니다',
    tenant_mode:  '회원공유',
    allowed_modes: ['회원공유'],
    feature_flags: { lesson_packages: false, autoassign: true, notifications: true, volunteer_hours: true },
    default_roles: ['홀', '주방', '카운터'],
    custom_field_presets: ['hourly_wage', 'employment_type', 'bank_account'],
    theme_preset: 'forest',
    industry_categories: ['음식·외식', '소매·유통', '의료·보건', '전문·사무서비스', '공공·비영리', '기타'],
  },
  'salonon': {
    id:           'salonon',
    appName:      'SALON:ON',
    tagline:      '고객이 직접 시술사를 고르고 예약합니다. 전화 없이',
    tenant_mode:  '비회원',
    allowed_modes: ['비회원'],
    feature_flags: { lesson_packages: false, autoassign: false, public_booking: true },
    default_roles: ['디자이너', '인턴'],
    custom_field_presets: ['service_type', 'request', 'allergy'],
    theme_preset: 'dusty_lavender',
    industry_categories: ['뷰티·헬스', '의료·보건', '기타'],
  },
  'careon': {
    id:           'careon',
    appName:      'CARE:ON',
    tagline:      '의료진 교대표, 빠짐 없이 채워지고 담당자는 하루 전 받습니다',
    tenant_mode:  '회원공유',
    allowed_modes: ['회원공유'],
    feature_flags: { lesson_packages: false, autoassign: true, notifications: true, care_mapping: true, volunteer_hours: true },
    default_roles: ['의사', '간호사', '간병인'],
    custom_field_presets: ['license', 'ward', 'shift_type'],
    theme_preset: 'pistachio',
    industry_categories: ['의료·보건', '공공·비영리', '기타'],
  },
  'serveon': {
    id:           'serveon',
    appName:      'SERVE:ON',
    tagline:      '봉사자 모집부터 배정·확인까지, 엑셀 없이 한 화면에',
    tenant_mode:  '비회원',
    allowed_modes: ['비회원', '회원공유'],
    feature_flags: { lesson_packages: false, autoassign: true, volunteer_hours: true, attendance: true },
    default_roles: ['봉사자', '담당자'],
    custom_field_presets: ['available_days', 'qualification', 'has_car'],
    theme_preset: 'sage',
    industry_categories: ['공공·비영리', '기타'],
  },
  'workon': {
    id:           'workon',
    appName:      'WORK:ON',
    tagline:      '팀 업무 스케줄, 구글 캘린더와 함께 한 곳에서',
    tenant_mode:  '회원공유',
    allowed_modes: ['회원공유'],
    feature_flags: { lesson_packages: false, autoassign: true, calendar_sync: true, volunteer_hours: true },
    default_roles: ['팀원', '팀장'],
    custom_field_presets: ['project', 'client', 'priority'],
    theme_preset: 'deep_midnight',
    industry_categories: ['전문·사무서비스', '소매·유통', '교육', '공공·비영리', '기타'],
  },
}

// URL ?vertical=xxx 파라미터에서 프리셋 반환. 없거나 알 수 없는 값이면 null.
export function getPresetFromParam(param: string | null): VerticalPreset | null {
  if (!param) return null
  return VERTICAL_PRESETS[param as VerticalId] ?? null
}
