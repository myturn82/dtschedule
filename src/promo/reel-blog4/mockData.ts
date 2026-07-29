// blog4 — 셋업 위자드 + 커스텀 필드 데모 데이터
import type { CustomFieldDef } from '../../types'

// Step7CustomFields에 미리 채워질 데모 필드
export const DEMO_FIELDS: CustomFieldDef[] = [
  {
    id: 'df1', label: '연락처', type: 'phone', required: true,
    placeholder: '010-0000-0000',
  },
  {
    id: 'df2', label: '방문 목적', type: 'select', required: false,
    options: [
      { name: '봉사', value: 'vol', value_type: 'none' },
      { name: '체험', value: 'exp', value_type: 'none' },
      { name: '방문', value: 'vis', value_type: 'none' },
    ],
    placeholder: '선택해주세요',
  },
  {
    id: 'df3', label: '개인정보 동의', type: 'checkbox', required: false,
  },
]

// SyncPhase 양쪽 패널 — Step7CustomFields의 FIELD_TYPE_DEFS와 동일한 8종
export const PROMO_FIELD_DEFS = [
  { id: 'text',           label: '텍스트',    icon: 'text'   },
  { id: 'number',         label: '숫자',      icon: 'hash'   },
  { id: 'select',         label: '드롭다운',  icon: 'list'   },
  { id: 'checkbox_group', label: '체크박스',  icon: 'square' },
  { id: 'checkbox',       label: '동의',      icon: 'check2' },
  { id: 'phone',          label: '전화번호',  icon: 'phone'  },
  { id: 'radio',          label: '라디오',    icon: 'dot'    },
  { id: 'image_upload',   label: '이미지첨부', icon: 'image'  },
] as const
