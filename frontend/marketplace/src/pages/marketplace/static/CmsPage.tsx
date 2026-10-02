import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useGetCmsPageQuery } from '@/services/marketplaceApi';
import { Button } from '@/components/ui/Button';
export default function CmsPage({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation(); const { data, isLoading, isError, refetch } = useGetCmsPageQuery({ slug, locale: i18n.language });
  useEffect(() => {
    if (!data) return;
    const previousTitle = document.title; document.title = data.seoTitle || `${data.title} · Manzil`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]'); const existed = Boolean(meta); const previous = meta?.content;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = data.seoDescription ?? '';
    return () => { document.title = previousTitle; if (!existed) meta?.remove(); else if (meta) meta.content = previous ?? ''; };
  }, [data]);
  return <PublicLayout><article className="mx-auto max-w-3xl px-5 py-12">{isLoading ? <p role="status">{t('common.loading')}</p> : isError ? <div role="alert"><p>{t('cms.unavailable')}</p><Button onClick={() => void refetch()}>{t('cms.retry')}</Button></div> : <><h1 className="text-3xl">{data?.title}</h1><div className="mt-6 whitespace-pre-wrap leading-8">{data?.body}</div></>}</article></PublicLayout>;
}
