// TimeSlot is now a plain string (e.g. '10-12', '09-10') generated
// dynamically from tenant settings via generateTimeSlots().
export type TimeSlot = string;

export type ViewType = 'month' | 'week' | 'day';

// Legacy default slots for the volunteer org — components should prefer
// the timeSlots array from TenantContext instead.
export const TIME_SLOTS: TimeSlot[] = [
  '10-12', '12-13', '13-14', '14-16', '16-18', '20-22',
];

export const DEFAULT_MAX_CAPACITY = 2;

// ─── Tenant types ─────────────────────────────────────────────────────────────

export type OptionValueType = 'amount' | 'quantity' | 'people' | 'session' | 'none'

export const OPTION_VALUE_TYPES: { value: OptionValueType; label: string; unit: string }[] = [
  { value: 'none',     label: '없음', unit: '' },
  { value: 'amount',   label: '금액', unit: '원' },
  { value: 'quantity', label: '수량', unit: '개' },
  { value: 'people',   label: '인원', unit: '명' },
  { value: 'session',  label: '회차', unit: '회' },
]

export function getOptionUnit(valueType?: OptionValueType | string): string {
  return OPTION_VALUE_TYPES.find(t => t.value === valueType)?.unit ?? ''
}

export interface CustomFieldOption {
  name: string;        // dropdown display label
  value: string;       // stored in extra_data, used for stats aggregation
  value_type?: OptionValueType;
}

export type CustomFieldType = 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'checkbox_group' | 'phone' | 'image_upload'

/** options를 가지는 타입 */
export const FIELD_TYPES_WITH_OPTIONS: CustomFieldType[] = ['select', 'radio', 'checkbox_group']
/** show_in_dashboard를 지원하는 타입 */
export const FIELD_TYPES_WITH_DASHBOARD: CustomFieldType[] = ['select', 'radio', 'checkbox_group', 'checkbox']

export interface CustomFieldDef {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: CustomFieldOption[];  // select, radio, checkbox_group
  placeholder?: string;           // text, number, select
  show_in_dashboard?: boolean;    // select, radio, checkbox_group, checkbox
  min?: number;                   // number 전용
  max?: number;                   // number 전용
}

export type TenantMode = '회원공유' | '회원개별' | '비회원';

export type WidgetAggOp = 'COUNT' | 'SUM' | 'AVG'
export type WidgetChartType = 'bar' | 'pie' | 'table'

export interface DashboardWidgetConfig {
  id: string
  title: string
  groupByFieldId: string       // select/radio/checkbox/checkbox_group field id
  aggregateOp: WidgetAggOp
  aggregateFieldId?: string    // number field id (required for SUM/AVG)
  chartType: WidgetChartType
}

export interface TenantSettings {
  open_from: string;               // 'HH:MM'
  open_to: string;                 // 'HH:MM'
  slot_interval_minutes: number;
  time_slots?: string[];           // Explicit slot list; overrides auto-generation when present
  title: string;
  theme_color?: string;            // '#RRGGBB'
  theme_preset?: import('../lib/themePresets').ThemePresetKey; // 포인트 컬러 프리셋
  timezone: string;                // IANA tz, e.g. 'Asia/Seoul'
  locale: string;                  // e.g. 'ko-KR'
  tenant_mode?: TenantMode | '회원선택';
  slot_labels?: Record<string, string>;
  legend_items?: LegendItem[];
  custom_fields?: CustomFieldDef[];
  dashboard_widgets?: DashboardWidgetConfig[];
  volunteer_label?: string;
  plus_label?: string;
  role_ratios?: Record<string, number>; // roleId → 퍼센트, 합계 100
  setup_completed_at?: string;
}

export type LegendColor = 'amber' | 'pink' | 'slate' | 'yellow' | 'blue' | 'green' | 'purple' | 'red' | 'indigo' | 'black'

export interface LegendItem {
  id: string
  icon: string
  label: string
  color: LegendColor
  url?: string
}

// ─── Customer / Plan types ────────────────────────────────────────────────────

export type PlanType = 'basic' | 'pro' | 'business'

export const PLAN_LABELS: Record<PlanType, string> = {
  basic:    'Basic (무료)',
  pro:      'Pro (월 9,900원)',
  business: 'Business (월 29,000원)',
}

export interface PlanLimits {
  maxOrgs: number
  maxUsers: number
}

export type PlanLimitsMap = Record<PlanType, PlanLimits>

// Fallback defaults, used until plan_limits table loads (or if a row is missing).
export const PLAN_LIMITS: PlanLimitsMap = {
  basic:    { maxOrgs: 1,        maxUsers: 20  },
  pro:      { maxOrgs: 5,        maxUsers: 100 },
  business: { maxOrgs: Infinity, maxUsers: Infinity },
}

export const PLAN_FEATURES: Record<PlanType, { autoNotify: boolean; excelExport: boolean; dashboard: boolean }> = {
  basic:    { autoNotify: false, excelExport: false, dashboard: false },
  pro:      { autoNotify: true,  excelExport: false, dashboard: false },
  business: { autoNotify: true,  excelExport: true,  dashboard: true  },
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  owner_user_id: string | null
  plan: PlanType
  plan_expires_at: string | null
  is_active: boolean
  deletion_requested_at: string | null
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  business_type: string | null;
  settings: TenantSettings;
  is_active: boolean;
  customer_id: string;
  created_at: string;
  updated_at: string;
}

// Access level within a tenant (controls RLS / admin permissions)
export type TenantAccessRole = 'admin' | 'member';

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantAccessRole;
  role_id: string | null;          // FK → tenant_roles.id
  is_approved: boolean;
  created_at: string;
  // Feature 8 — 탈퇴
  withdrawal_status: 'none' | 'pending' | 'approved';
  withdrawal_requested_at: string | null;
  withdrawal_approved_at: string | null;
  // Feature 5 — 자동배정 선호
  available_days: number[] | null;   // 0=일, 1=월 ... 6=토, null=제한없음
  monthly_limit: number | null;      // null=제한없음
}

// Custom role entity defined per-tenant
export interface TenantRole {
  id: string;
  tenant_id: string;
  name: string;
  split_cell: boolean;
  indicator_bar: boolean;
  requires_customer_info: boolean;
  display_order: number;
  created_at: string;
}

export interface TenantMemberWithRole extends TenantMember {
  profile: Profile;
  tenant_role: TenantRole | null;
}

export type MemberType = 'member' | '50plus' | 'admin_note';

export const TYPE_LABELS: Record<MemberType, string> = {
  member: '팀원',
  '50plus': '50플러스활동가',
  admin_note: '관리자 메모',
};

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  is_approved: boolean;
  terms_agreed_at: string | null;
  privacy_agreed_at: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  tenant_id: string;
  year: number;
  month: number;
  day: number;
  time_slot: TimeSlot;
  member_name: string;
  note: string | null;
  member_type: MemberType;
  time_sub: string | null;
  color: string | null;
  user_id: string | null;
  role_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  extra_data?: Record<string, string>;
  is_locked: boolean;
  account_deleted: boolean;
  created_at: string;
}

export interface SlotSetting {
  id: string;
  tenant_id: string;
  time_slot: TimeSlot;
  max_capacity: number;
  updated_by: string | null;
}

export interface ScheduleRule {
  id: string;
  tenant_id: string;
  day_of_week: number; // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  time_slot: TimeSlot;
  is_open: boolean;
}

export interface DateOverride {
  id: string;
  tenant_id: string;
  date: string; // 'YYYY-MM-DD'
  is_open: boolean;
  is_holiday: boolean;
  is_locked: boolean;
  label: string | null;
}

export interface CellState {
  isBreaktime: boolean;
  isClosed: boolean;
  isHoliday: boolean;
  isNightShift: boolean;
  isSaturdayShift: boolean;
  isLocked: boolean;
  assignments: Assignment[];
  maxCapacity: number;
  isFull: boolean;
}

export interface ModalTarget {
  year: number;
  month: number;
  day: number;
  timeSlot: TimeSlot;
  memberType: MemberType;
  roleId?: string | null;
}
