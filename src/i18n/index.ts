import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: ['common', 'superadmin', 'admin', 'schedule', 'auth'],
    detection: {
      // localStorage 먼저 확인 → 없으면 브라우저 언어 감지
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dtschedule-lang',
    },
    interpolation: {
      escapeValue: false, // React가 XSS를 처리하므로 불필요
    },
  })

export default i18n
