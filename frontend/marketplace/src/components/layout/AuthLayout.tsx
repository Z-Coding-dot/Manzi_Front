import { BrandLogo } from '@/components/ui/BrandLogo'
import { AnimatedContent } from './AnimatedContent'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
} 

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-forest p-10 text-white md:flex">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo />
        </Link>
        <div className="max-w-sm">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-4xl leading-tight text-white"
          >
            {t('app.tagline')}
          </motion.h1>
        </div>
        <p className="text-xs text-white/50">© {new Date().getFullYear()} Manzil</p>
      </div>

      <div className="flex items-center justify-center p-5 sm:p-8">
        <AnimatedContent className="w-full max-w-sm">{children}</AnimatedContent>
      </div>
    </div>
  )
}
