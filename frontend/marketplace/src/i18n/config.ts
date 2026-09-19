import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import faAF from './locales/fa-AF.json'
import psAF from './locales/ps-AF.json'

export const LANGUAGES = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr' as const },
  'fa-AF': { label: 'Dari', nativeLabel: 'دری', dir: 'rtl' as const },
  'ps-AF': { label: 'Pashto', nativeLabel: 'پښتو', dir: 'rtl' as const },
}

export type LanguageCode = keyof typeof LANGUAGES

export function getDirection(lang: string): 'ltr' | 'rtl' {
  return LANGUAGES[lang as LanguageCode]?.dir ?? 'ltr'
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'fa-AF': { translation: faAF },
      'ps-AF': { translation: psAF },
    },
    fallbackLng: 'en',
    supportedLngs: Object.keys(LANGUAGES),
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'manzil_marketplace_lang',
    },
  })

export default i18n
