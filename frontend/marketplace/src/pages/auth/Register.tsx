import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { SelectField } from '@/components/ui/SelectField'
import { LANGUAGES } from '@/i18n/config'
import { useAppDispatch } from '@/redux/hooks'
import { loginSuccess } from '@/redux/slices/authSlice'

export default function Register() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    // TODO(backend): POST /api/v1/auth/register
    setTimeout(() => {
      dispatch(loginSuccess({ id: 'c_new', name: 'New Traveler', email: 'new@example.com', language: i18n.language }))
      setLoading(false)
      navigate('/account')
    }, 500)
  }

  return (
    <AuthLayout>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}>
        <h2 className="text-2xl text-ink">{t('auth.createAccountTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('auth.createAccountSubtitle')}</p>

        <div className="mt-6">
          <Field label={t('auth.fullName')} required />
        </div>
        <div className="mt-4">
          <Field label={t('auth.email')} type="email" required />
        </div>
        <div className="mt-4">
          <Field label={t('auth.phone')} type="tel" placeholder="+93 7X XXX XXXX" required />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SelectField label={t('auth.country')} defaultValue="Afghanistan">
            <option>Afghanistan</option>
            <option>Other</option>
          </SelectField>
          <SelectField label={t('auth.preferredLanguage')} defaultValue={i18n.language}>
            {Object.entries(LANGUAGES).map(([code, meta]) => (
              <option key={code} value={code}>
                {meta.nativeLabel}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mt-4">
          <PasswordInput label={t('auth.password')} required />
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? t('common.loading') : t('auth.createAccount')}
        </Button>

        <p className="mt-6 text-center text-sm text-muted">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-forest hover:underline">
            {t('auth.signInLink')}
          </Link>
        </p>
      </motion.form>
    </AuthLayout>
  )
}
