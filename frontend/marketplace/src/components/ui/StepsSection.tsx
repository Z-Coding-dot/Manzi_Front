import { CalendarCheck, Compass, DoorOpen, ClipboardCheck, Building2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function StepsSection({ owners = false }: { owners?: boolean }) {
  const { t, i18n } = useTranslation();
  const icons = owners ? [ClipboardCheck, Building2, ShieldCheck] : [Compass, CalendarCheck, DoorOpen];
  return <section className="relative overflow-hidden bg-paper py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-widest text-forest">{t(owners ? 'owners.eyebrow' : 'journey.eyebrow')}</p>
        <h2 className="font-display mt-3 text-3xl sm:text-4xl">{t(owners ? 'owners.stepsTitle' : 'home.howItWorksTitle')}</h2>
        <p className="mt-4 text-sm leading-7 text-body">{t(owners ? 'owners.stepsSubtitle' : 'journey.subtitle')}</p>
      </div>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {icons.map((Icon, index) => <li key={index} className="relative rounded-2xl border border-line bg-white p-6 text-start shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-soft text-forest"><Icon className="h-7 w-7" /></span>
            <span className="font-display text-4xl text-forest/20">{new Intl.NumberFormat(i18n.language, { minimumIntegerDigits: 2 }).format(index + 1)}</span>
          </div>
          <h3 className="mt-6 text-lg">{t(owners ? `owners.step${index + 1}Title` : `home.howItWorksStep${index + 1}Title`)}</h3>
          <p className="mt-3 text-sm leading-7 text-body">{t(owners ? `owners.step${index + 1}Body` : `home.howItWorksStep${index + 1}Body`)}</p>
        </li>)}
      </ol>
    </div>
  </section>;
}
