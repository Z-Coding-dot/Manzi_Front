import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PropertyMap } from '@/components/ui/PropertyMap';
import { Button } from '@/components/ui/Button';
import { useGetPublishedPropertiesQuery } from '@/services/marketplaceApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { DEFAULT_PROPERTY_PLACEHOLDER } from '@/utils/placeholderImage';

export default function MapView() {
  const { data, isLoading, isError, refetch } = useGetPublishedPropertiesQuery();
  const properties = useMemo(() => data ?? [], [data]);
  const { t, i18n } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  return <PublicLayout><section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <p className="text-xs font-semibold tracking-widest text-forest">{t('home.heroEyebrow')}</p>
    <h1 className="font-display mt-3 text-3xl text-ink sm:text-4xl">{t('map.title')}</h1>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-body">{t('map.subtitle')}</p>
    <div className="mt-7 grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="order-2 max-h-[560px] space-y-3 overflow-y-auto lg:order-1">
        {isLoading ? <p role="status" className="p-5">{t('common.loading')}</p> : isError ? <div role="alert" className="rounded-xl border border-line p-5"><p>{t('map.loadError')}</p><Button className="mt-4" onClick={() => void refetch()}>{t('common.retry')}</Button></div> : !properties.length ? <p className="rounded-xl bg-paper p-5">{t('common.noResults')}</p> : properties.map((property) => <article key={property.id} className={`rounded-xl border p-3 transition-colors ${activeId === property.id ? 'border-forest bg-forest-soft' : 'border-line bg-white'}`}>
          <button onClick={() => setActiveId(property.id)} className="flex w-full items-start gap-3 text-start" aria-label={t('map.showProperty', { name: property.name })} aria-pressed={activeId === property.id}>
            <img src={property.images[0] || DEFAULT_PROPERTY_PLACEHOLDER} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = DEFAULT_PROPERTY_PLACEHOLDER; }} />
            <div className="min-w-0"><h2 className="text-sm font-semibold">{property.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-body"><MapPin className="h-3 w-3 shrink-0" />{property.area}</p><p className="mt-2 text-sm font-semibold text-forest">{formatCurrency(property.fromPrice, property.currency, i18n.language)}</p></div>
          </button>
          <Link to={`/property/${property.slug}`} className="mt-3 block rounded-lg bg-paper px-3 py-2 text-center text-xs font-medium text-forest hover:bg-forest-soft">{t('common.viewDetails')}</Link>
        </article>)}
      </div>
      <div className="order-1 min-w-0 lg:order-2"><PropertyMap properties={properties} activeId={activeId} onSelect={setActiveId} /></div>
    </div>
  </section></PublicLayout>;
}
