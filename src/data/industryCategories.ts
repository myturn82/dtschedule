export interface IndustryMid { value: string; label: string }
export interface IndustryTop { value: string; label: string; children: IndustryMid[] }

export const INDUSTRY_CATEGORIES: IndustryTop[] = [
  {
    value: 'beauty-health', label: '뷰티·헬스',
    children: [
      { value: 'hair',    label: '미용실·헤어샵' },
      { value: 'skin',    label: '피부관리·에스테틱' },
      { value: 'nail',    label: '네일아트' },
      { value: 'spa',     label: '마사지·스파' },
      { value: 'fitness', label: '헬스클럽·피트니스' },
      { value: 'other',   label: '기타' },
    ],
  },
  {
    value: 'medical', label: '의료·보건',
    children: [
      { value: 'clinic',   label: '병원·의원' },
      { value: 'dental',   label: '치과' },
      { value: 'oriental', label: '한의원' },
      { value: 'pharmacy', label: '약국' },
      { value: 'nursing',  label: '요양원·요양병원' },
      { value: 'other',    label: '기타' },
    ],
  },
  {
    value: 'education', label: '교육',
    children: [
      { value: 'academy',   label: '학원·교습소' },
      { value: 'childcare', label: '어린이집·유치원' },
      { value: 'school',    label: '학교' },
      { value: 'tutor',     label: '강사·튜터' },
      { value: 'other',     label: '기타' },
    ],
  },
  {
    value: 'sports-leisure', label: '스포츠·레저',
    children: [
      { value: 'yoga',     label: '요가·필라테스' },
      { value: 'swimming', label: '수영장' },
      { value: 'martial',  label: '무술·격투기' },
      { value: 'golf',     label: '골프' },
      { value: 'sports',   label: '종합스포츠센터' },
      { value: 'other',    label: '기타' },
    ],
  },
  {
    value: 'food', label: '음식·외식',
    children: [
      { value: 'restaurant', label: '식당·음식점' },
      { value: 'cafe',       label: '카페·디저트' },
      { value: 'bakery',     label: '베이커리' },
      { value: 'other',      label: '기타' },
    ],
  },
  {
    value: 'retail', label: '소매·유통',
    children: [
      { value: 'convenience', label: '소매점·편의점' },
      { value: 'mart',        label: '마트·슈퍼마켓' },
      { value: 'other',       label: '기타' },
    ],
  },
  {
    value: 'professional', label: '전문·사무서비스',
    children: [
      { value: 'legal',  label: '법무·회계·세무' },
      { value: 'it',     label: 'IT·기술서비스' },
      { value: 'design', label: '디자인·미디어' },
      { value: 'realty', label: '부동산' },
      { value: 'other',  label: '기타' },
    ],
  },
  {
    value: 'public', label: '공공·비영리',
    children: [
      { value: 'gov',       label: '행정기관' },
      { value: 'library',   label: '도서관·문화시설' },
      { value: 'welfare',   label: '복지시설·사회서비스' },
      { value: 'religious', label: '종교단체' },
      { value: 'volunteer', label: '자원봉사·시민단체' },
      { value: 'other',     label: '기타' },
    ],
  },
  { value: 'etc', label: '기타', children: [] },
]
