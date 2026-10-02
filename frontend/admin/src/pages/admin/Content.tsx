import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { providerApi } from '@/services/providerApi';
import { httpClient } from '@/api/httpClient';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/redux/hooks';
type Kind = 'pages' | 'banners' | 'posts' | 'settings';
interface ContentRecord { id?: string; key?: string; title?: string; slug?: string; locale?: string; body?: string; status?: string; seoTitle?: string; seoDescription?: string; image?: string; link?: string; coverImage?: string; sortOrder?: number; active?: boolean; value?: unknown }
const api = providerApi.injectEndpoints({ endpoints: builder => ({
  cmsRecords: builder.query<ContentRecord[], Kind>({ queryFn: async kind => { try { return { data: (await httpClient.get<ContentRecord[]>(`/admin/cms/${kind}`)).data }; } catch { return { error: { status: 'CUSTOM_ERROR', data: 'Request failed' } }; } }, providesTags: ['Property'] }),
  saveContent: builder.mutation<ContentRecord, { kind: Kind; id?: string; body: Record<string, unknown> }>({ queryFn: async ({ kind, id, body }) => { try { return { data: (await httpClient.request<ContentRecord>({ url: `/admin/cms/${kind}${id ? `/${id}` : ''}`, method: id ? 'PATCH' : 'POST', data: body })).data }; } catch { return { error: { status: 'CUSTOM_ERROR', data: 'Request failed' } }; } }, invalidatesTags: ['Property'] }),
}) });
export default function Content() {
  const canManageSettings = useAppSelector(s => s.auth.user?.role === 'super_admin');
  const { t } = useTranslation(); const [kind, setKind] = useState<Kind>('pages'); const [record, setRecord] = useState<ContentRecord | null>(null); const [message, setMessage] = useState(''); const [failed, setFailed] = useState(false);
  const { data = [], isLoading, isError, refetch } = api.useCmsRecordsQuery(kind);
  const [save, { isLoading: saving }] = api.useSaveContentMutation();
  function field(key: keyof ContentRecord, value: unknown) { setRecord(r => ({ ...r, [key]: value })); }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!record) return; setMessage('');
    let body: Record<string, unknown>;
    if (kind === 'settings') body = { key: record.key, value: typeof record.value === 'string' ? record.value : JSON.stringify(record.value) };
    else if (kind === 'banners') body = { locale: record.locale, title: record.title, body: record.body ?? '', image: record.image || undefined, link: record.link || undefined, sortOrder: Number(record.sortOrder ?? 0), active: Boolean(record.active) };
    else body = { slug: record.slug, locale: record.locale, title: record.title, body: record.body ?? '', status: record.status, ...(kind === 'pages' ? { seoTitle: record.seoTitle || undefined, seoDescription: record.seoDescription || undefined } : { coverImage: record.coverImage || undefined }) };
    try { await save({ kind, id: record.id, body }).unwrap(); setFailed(false); setMessage(t('admin.saved')); setRecord(null); } catch { setFailed(true); setMessage(t('admin.saveError')); }
  }
  const textField = (key: keyof ContentRecord, required = false) => <label className="block space-y-1" key={key}><span>{t(`admin.contentFields.${key}`)}</span><input required={required} value={String(record?.[key] ?? '')} onChange={e => field(key, e.target.value)} className="w-full rounded border border-line p-2" /></label>;
  return <div className="space-y-5">
    <div>
      <h2 className="text-xl font-semibold text-ink">{t('admin.content')}</h2>
      <p className="mt-1 text-sm text-muted">Manage pages, banners, blog posts and platform settings.</p>
    </div>
    <div className="flex flex-wrap gap-2">{(['pages','banners','posts','settings'] as Kind[]).map(k => <Button key={k} variant={kind === k ? 'primary' : 'secondary'} onClick={() => { setKind(k); setRecord(null); setMessage(''); }}>{t(`admin.contentKinds.${k}`)}</Button>)}</div>
    {message && <p role={failed ? 'alert' : 'status'}>{message}</p>}
    {(kind !== 'settings' || canManageSettings) && <Button onClick={() => { setMessage(''); setRecord({ locale: 'en', status: 'draft', body: '', active: false, sortOrder: 0, value: '{}' }); }}>{t('admin.create')}</Button>}
    {record && <form onSubmit={e => void submit(e)} className="space-y-4 rounded-lg border border-line bg-white p-5">
      {kind === 'settings' ? <>{textField('key', true)}<label className="block">{t('admin.contentFields.value')}<textarea required dir="ltr" value={typeof record.value === 'string' ? record.value : JSON.stringify(record.value, null, 2)} onChange={e => field('value', e.target.value)} className="w-full border p-2" /></label></> : <>
        {textField('title', true)}{kind !== 'banners' && textField('slug', true)}<label>{t('admin.contentFields.locale')}<select value={record.locale} onChange={e => field('locale', e.target.value)} className="ms-3 border p-2"><option value="en">English</option><option value="fa_AF">دری</option><option value="ps_AF">پښتو</option></select></label>
        <label className="block">{t('admin.contentFields.body')}<textarea rows={8} value={record.body} onChange={e => field('body', e.target.value)} className="w-full rounded border border-line p-2" /></label>
        {kind === 'banners' ? <>{textField('image')}{textField('link')}<label>{t('admin.contentFields.sortOrder')}<input type="number" value={record.sortOrder ?? 0} onChange={e => field('sortOrder', Number(e.target.value))} className="ms-3 border p-2" /></label><label className="flex gap-2"><input type="checkbox" checked={record.active ?? false} onChange={e => field('active', e.target.checked)} />{t('admin.contentFields.active')}</label></> : <><label>{t('admin.status')}<select value={record.status} onChange={e => field('status', e.target.value)} className="ms-3 border p-2"><option value="draft">{t('admin.draft')}</option><option value="published">{t('admin.publish')}</option></select></label>{kind === 'pages' ? <>{textField('seoTitle')}{textField('seoDescription')}</> : textField('coverImage')}</>}
      </>}<div className="flex gap-3"><Button disabled={saving}>{t('admin.save')}</Button><Button type="button" variant="secondary" onClick={() => setRecord(null)}>{t('admin.close')}</Button></div>
    </form>}
    {isLoading ? <p role="status">{t('common.loading')}</p> : isError ? <div role="alert">{t('admin.loadError')}<Button onClick={() => void refetch()}>{t('admin.retry')}</Button></div> : !data.length ? <p>{t('common.noResults')}</p> : <div className="space-y-3">{data.map(item => <div key={item.id ?? item.key} className="flex items-center justify-between gap-3 rounded border border-line bg-white p-4"><div><strong>{item.title ?? item.key}</strong><p className="text-sm text-muted">{item.locale} · {item.slug} · {item.status}</p></div><Button variant="secondary" onClick={() => setRecord({ ...item })}>{t('admin.edit')}</Button></div>)}</div>}
  </div>;
}
