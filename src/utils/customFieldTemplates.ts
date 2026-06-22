import type { CustomFieldDef } from '../types'

export const CUSTOM_FIELD_TEMPLATES: { label: string; field: Omit<CustomFieldDef, 'id'> }[] = [
  { label: '성명',    field: { label: '성명',    type: 'text',  required: true,  placeholder: '홍길동' } },
  { label: '전화번호', field: { label: '전화번호', type: 'phone', required: true,  placeholder: '010-0000-0000' } },
  { label: '이메일',  field: { label: '이메일',  type: 'text',  required: false, placeholder: 'example@email.com' } },
  { label: '생년월일', field: { label: '생년월일', type: 'text',  required: false, placeholder: '예: 1990-01-01' } },
  { label: '메모',    field: { label: '메모',    type: 'text',  required: false, placeholder: '특이사항을 입력하세요' } },
]
