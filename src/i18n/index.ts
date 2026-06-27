import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import koCommon from './locales/ko/common.json'
import koSuperadmin from './locales/ko/superadmin.json'
import koAdmin from './locales/ko/admin.json'
import koSchedule from './locales/ko/schedule.json'
import koAuth from './locales/ko/auth.json'

import enCommon from './locales/en/common.json'
import enSuperadmin from './locales/en/superadmin.json'
import enAdmin from './locales/en/admin.json'
import enSchedule from './locales/en/schedule.json'
import enAuth from './locales/en/auth.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']

export const resources = {
  ko: {
    common: koCommon,
    superadmin: koSuperadmin,
    admin: koAdmin,
    schedule: koSchedule,
    auth: koAuth,
  },
  en: {
    common: enCommon,
    superadmin: enSuperadmin,
    admin: enAdmin,
    schedule: enSchedule,
    auth: enAuth,
  },
} as const

// localStorage에 저장된 언어 읽기 (사용자가 명시적으로 선택한 경우만)
const LANG_KEY = 'dtschedule-lang'
const savedLang = localStorage.getItem(LANG_KEY)
const initialLng = (savedLang === 'ko' || savedLang === 'en') ? savedLang : 'ko'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: ['common', 'superadmin', 'admin', 'schedule', 'auth'],
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
