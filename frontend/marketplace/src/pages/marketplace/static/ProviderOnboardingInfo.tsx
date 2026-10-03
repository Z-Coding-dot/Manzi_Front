import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { StepsSection } from '@/components/ui/StepsSection';
import { providerUrl } from '@/utils/providerUrl';

export default function ProviderOnboardingInfo() {
  const { t } = useTranslation();
  return <PublicLayout>
    <section className="bg-forest px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-white/70">{t('owners.eyebrow')}</p>
        <h1 className="font-display mt-4 max-w-3xl text-4xl leading-tight text-white sm:text-6xl">{t('owners.title')}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">{t('owners.subtitle')}</p>
        <a href={providerUrl('/signup')} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-forest-deep">{t('owners.start')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></a>
      </div>
    </section>
    <StepsSection owners />
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="flex items-start gap-3 rounded-2xl border border-line bg-forest-soft p-5 text-sm leading-7 text-forest-deep"><ShieldCheck className="mt-1 h-5 w-5 shrink-0" />{t('owners.verification')}</p>
      <p className="mt-6 text-sm text-body">{t('auth.haveAccount')} <a href={providerUrl('/login')} className="font-semibold text-forest hover:underline">{t('owners.dashboard')}</a></p>
    </div>
  </PublicLayout>;
}
