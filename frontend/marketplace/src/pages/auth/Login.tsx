import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useAppDispatch } from '@/redux/hooks'
import { loginSuccess } from '@/redux/slices/authSlice'

export default function Login() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    // TODO(backend): POST /api/v1/auth/login
    setTimeout(() => {
      dispatch(loginSuccess({ id: 'c1', name: 'Sarah Whitman', email: 'sarah.w@example.com', language: i18n.language }))
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
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl">{t('auth.welcomeBack')}</h2>
        <p className="mt-1 text-sm text-muted">{t('auth.loginSubtitle')}</p>

        <div className="mt-6">
          <Field label={t('auth.email')} type="email" required defaultValue="sarah.w@example.com" />
        </div>
        <div className="mt-4">
          <PasswordInput label={t('auth.password')} required defaultValue="demo-password" />
        </div>
        <div className="mt-2 text-end">
          <Link to="/forgot-password" className="text-xs text-forest hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? t('common.loading') : t('auth.signIn')}
        </Button>

        <p className="mt-6 text-center text-sm text-muted">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-forest hover:underline">
            {t('auth.signUpLink')}
          </Link>
        </p>
      </motion.form>
    </AuthLayout>
  )
}
