import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AccountLayout } from '@/components/layout/AccountLayout'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { loginSuccess, type CustomerUser } from '@/redux/slices/authSlice'
import { httpClient } from '@/api/httpClient'

export default function AccountProfile() {
  const { t } = useTranslation()
  const user = useAppSelector((s) => s.auth.user)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const dispatch = useAppDispatch()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false); setError(''); setSaving(true)
    const values = new FormData(e.currentTarget)
    try { const { data } = await httpClient.patch<CustomerUser>('/users/me', { name: values.get('name'), ...(values.get('phone') ? { phone: values.get('phone') } : {}) }); dispatch(loginSuccess(data)); setSaved(true) }
    catch { setError(t('booking.saveError')) } finally { setSaving(false) }
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
        {error && <p role="alert" className="text-danger">{error}</p>}
        <Field name="name" label={t('auth.fullName')} defaultValue={user?.name} required />
        <Field label={t('auth.email')} type="email" defaultValue={user?.email} readOnly />
        <Field name="phone" label={t('auth.phone')} type="tel" placeholder="+93 7X XXX XXXX" />
        <Button type="submit" disabled={saving}>{t('common.save')}</Button>
      </form>
    </AccountLayout>
  )
}
