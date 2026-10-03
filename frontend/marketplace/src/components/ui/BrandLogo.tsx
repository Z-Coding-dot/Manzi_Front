import { useTranslation } from 'react-i18next';

export function BrandLogo() {
  const { t } = useTranslation();
  return <span className="flex items-center gap-2">
    <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
      <img src="/Manzil_Logo.webp" alt="" className="absolute left-1/2 top-[-19px] w-[180px] max-w-none -translate-x-1/2" />
    </span>
    <span className="font-display text-xl">{t('app.name')}</span>
  </span>;
}
