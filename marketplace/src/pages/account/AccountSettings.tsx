import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AccountLayout } from '@/components/layout/AccountLayout'
import { SelectField } from '@/components/ui/SelectField'
import { getDirection, LANGUAGES, type LanguageCode } from '@/i18n/config'

export default function AccountSettings() {
  const { t, i18n } = useTranslation()
  const [currency, setCurrency] = useState<'AFN' | 'USD'>('AFN')

  function handleLanguageChange(lang: LanguageCode) {
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = getDirection(lang)
  }

  return (
    <AccountLayout>
      <h1 className="text-2xl text-ink">{t('account.settings')}</h1>

      <div className="mt-6 max-w-md space-y-4">
        <SelectField label={t('auth.preferredLanguage')} value={i18n.language} onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}>
          {Object.entries(LANGUAGES).map(([code, meta]) => (
            <option key={code} value={code}>
              {meta.nativeLabel}
            </option>
          ))}
        </SelectField>
        <SelectField label="Preferred currency" value={currency} onChange={(e) => setCurrency(e.target.value as 'AFN' | 'USD')}>
          <option value="AFN">AFN</option>
          <option value="USD">USD</option>
        </SelectField>
      </div>
    </AccountLayout>
  )
}
