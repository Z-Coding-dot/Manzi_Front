import { BarChart3, CloudOff, ShieldCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { StepsSection } from '@/components/ui/StepsSection';

export default function ForPropertyOwners() {
  const { t } = useTranslation();
  return <PublicLayout>
    <section className="bg-forest px-4 py-20 text-center">
      <h1 className="font-display mx-auto max-w-3xl text-4xl text-white sm:text-5xl">{t('home.forOwnersTitle')}</h1>
      <p className="mx-auto mt-5 max-w-xl leading-7 text-white/80">{t('home.forOwnersSubtitle')}</p>
      <Link to="/provider-onboarding-info" className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-forest-deep">{t('home.forOwnersCta')}</Link>
    </section>
    <section className="mx-auto grid max-w-6xl gap-5 px-4 py-16 sm:grid-cols-2 sm:px-6">
      {[Users, ShieldCheck, CloudOff, BarChart3].map((Icon, index) => <article key={index} className="rounded-2xl border border-line p-7">
        <Icon className="h-7 w-7 text-forest" /><h2 className="mt-4 text-lg">{t(`owners.benefit${index + 1}Title`)}</h2><p className="mt-3 text-sm leading-7 text-body">{t(`owners.benefit${index + 1}Body`)}</p>
      </article>)}
    </section>
    <StepsSection owners />
  </PublicLayout>;
}
