import { useEffect } from 'react';
import { BookOpen, ArrowRight, FileQuestion, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useGetCmsPageQuery } from '@/services/marketplaceApi';
import { Button } from '@/components/ui/Button';

interface PageContent { title: string; intro: string; sections: { title: string; body: string }[] }
export default function CmsPage({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation();
  const { currentData: data, isError, refetch } = useGetCmsPageQuery({ slug, locale: i18n.language });
  const fallback = t(`pages.${slug}`, { returnObjects: true }) as unknown as PageContent;
  const hasFallback = typeof fallback === 'object' && Boolean(fallback.title);
  const title = data?.title || (hasFallback ? fallback.title : t('cms.unavailable'));
  useEffect(() => {
    const previousTitle = document.title;
    document.title = data?.seoTitle || `${title} · Manzil`;
    const existing = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const meta = existing || document.createElement('meta');
    const previous = meta.content;
    meta.name = 'description';
    meta.content = data?.seoDescription || (hasFallback ? fallback.intro : '');
    if (!existing) document.head.appendChild(meta);
    return () => { document.title = previousTitle; if (!existing) meta.remove(); else meta.content = previous; };
  }, [data, title, hasFallback, fallback.intro]);
  return <PublicLayout>
    <section className="bg-forest px-4 py-14 text-center sm:py-20">
      <BookOpen className="mx-auto h-8 w-8 text-white/70" />
      <p className="mt-4 text-sm font-medium text-white/70">{t('app.name')}</p>
      <h1 className="font-display mt-3 text-4xl text-white sm:text-5xl">{title}</h1>
      {hasFallback && <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/80">{fallback.intro}</p>}
    </section>
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {data ? <div className="rounded-2xl border border-line bg-white p-6 whitespace-pre-wrap leading-8 text-body sm:p-10">{data.body}</div>
        : hasFallback ? <div className="space-y-5">{fallback.sections.map((section, index) => <section key={index} className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h2 className="text-xl text-ink">{section.title}</h2><p className="mt-4 whitespace-pre-line text-sm leading-8 text-body">{section.body}</p>
        </section>)}</div>
        : <div role={isError ? 'alert' : 'status'} className="mx-auto max-w-lg rounded-3xl border border-line bg-paper p-8 text-center">
          <FileQuestion className="mx-auto h-10 w-10 text-forest" /><h2 className="mt-5 text-xl">{t('cms.unavailable')}</h2><p className="mt-3 text-sm leading-7">{t('cms.unavailableBody')}</p><Button className="mt-6" onClick={() => void refetch()}>{t('cms.retry')}</Button>
        </div>}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-forest">
        {slug === 'contact' && <a href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@manzil.af'}`} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3"><Mail className="h-4 w-4" /><span dir="ltr">{import.meta.env.VITE_SUPPORT_EMAIL || 'support@manzil.af'}</span></a>}
        <Link to="/search" className="inline-flex items-center gap-2 rounded-xl bg-forest-soft px-5 py-3">{t('home.searchCta')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
        {slug !== 'help' && <Link to="/help">{t('footer.help')}</Link>}
        {slug !== 'contact' && <Link to="/contact">{t('footer.contact')}</Link>}
      </div>
    </article>
  </PublicLayout>;
}
