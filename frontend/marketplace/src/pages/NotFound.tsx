import { Compass, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AnimatedContent } from '@/components/layout/AnimatedContent';

export default function NotFound() {
  const { t } = useTranslation();
  return <AnimatedContent><main className="flex min-h-dvh items-center justify-center bg-paper px-4 py-12">
    <div className="w-full max-w-xl rounded-3xl border border-line bg-white p-8 text-center shadow-sm sm:p-14">
      <Compass className="mx-auto h-12 w-12 text-forest" />
      <p className="font-display mt-4 text-7xl text-forest/20 sm:text-8xl">404</p>
      <h1 className="font-display mt-3 text-3xl text-ink">{t('errors.notFound')}</h1>
      <p className="mt-4 text-sm leading-7 text-body">{t('errors.notFoundBody')}</p>
      <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-forest px-6 py-3 font-medium text-white">{t('errors.backHome')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
    </div>
  </main></AnimatedContent>;
}
