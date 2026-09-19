import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AccountLayout } from '@/components/layout/AccountLayout'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { useAppSelector } from '@/redux/hooks'

export default function AccountProfile() {
  const { t } = useTranslation()
  const user = useAppSelector((s) => s.auth.user)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO(backend): PATCH /api/v1/users/me
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AccountLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-ink">{t('account.profile')}</h1>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-forest">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <Field label={t('auth.fullName')} defaultValue={user?.name} />
        <Field label={t('auth.email')} type="email" defaultValue={user?.email} />
        <Field label={t('auth.phone')} type="tel" placeholder="+93 7X XXX XXXX" />
        <Button type="submit">Save changes</Button>
      </form>
    </AccountLayout>
  )
}
