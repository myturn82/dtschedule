export const SCHEDULE_RULE_TEMPLATES: { label: string; description: string; openDays: number[]; includeHolidays?: boolean }[] = [
  { label: '연중무휴',          description: '공휴일도 포함, 매일 365일 운영', openDays: [0,1,2,3,4,5,6], includeHolidays: true },
  { label: '평일만 (월-금)',    description: '월~금 운영, 토·일 미운영',       openDays: [1,2,3,4,5] },
  { label: '평일+토 (월-토)',   description: '월~토 운영, 일요일 미운영',      openDays: [1,2,3,4,5,6] },
  { label: '주말만 (토·일)',    description: '토·일만 운영',                   openDays: [0,6] },
  { label: '월·수·금',         description: '월·수·금 격일 운영',             openDays: [1,3,5] },
  { label: '화·목',            description: '화·목 격일 운영',                openDays: [2,4] },
]
