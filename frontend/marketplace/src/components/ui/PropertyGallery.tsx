import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_PROPERTY_PLACEHOLDER } from '@/utils/placeholderImage';

export function PropertyGallery({ images, name }: { images: string[]; name: string }) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const photos = images.length ? images : [DEFAULT_PROPERTY_PLACEHOLDER];
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const active = Math.min(selected, photos.length - 1);
  const move = (offset: number) => setSelected((current) => (current + offset + photos.length) % photos.length);
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const forward = event.key === 'ArrowRight' ? 1 : -1;
        setSelected((current) => (current + (i18n.dir() === 'rtl' ? -forward : forward) + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, photos.length, i18n]);
  const image = (src: string, index: number, className: string) => <img src={src} alt={t('gallery.photo', { name, count: index + 1 })} className={className} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = DEFAULT_PROPERTY_PLACEHOLDER; }} />;
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      <Dialog.Trigger asChild>
        <button className="group relative block w-full" aria-label={t('gallery.expand')}>
          {image(photos[active], active, 'h-[260px] w-full bg-forest-deep/5 object-contain sm:h-[360px] lg:h-[420px]')}
        </button>
      </Dialog.Trigger>
      <div className="flex justify-end border-t border-line bg-white px-3 py-3 sm:px-4">
        <Dialog.Trigger asChild><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-forest-soft"><Expand className="h-4 w-4 shrink-0" />{t('gallery.viewAll', { count: photos.length })}</button></Dialog.Trigger>
      </div>
      {photos.length > 1 && <div className="flex gap-2 overflow-x-auto p-3" aria-label={t('gallery.thumbnails')}>
        {photos.map((src, index) => <button key={`${src}-${index}`} onClick={() => setSelected(index)} aria-label={t('gallery.photo', { name, count: index + 1 })} aria-pressed={active === index} className={`shrink-0 overflow-hidden rounded-xl border-2 p-0.5 ${active === index ? 'border-forest' : 'border-transparent hover:border-forest/40'}`}>
          {image(src, index, 'h-16 w-24 rounded-lg object-cover sm:h-20 sm:w-28')}
        </button>)}
      </div>}
    </div>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
      <Dialog.Content className="gallery-dialog fixed inset-x-0 top-0 z-50 grid h-dvh min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-3 overflow-hidden text-white sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:h-[min(88dvh,850px)] sm:w-[min(92vw,1200px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-white/15 sm:bg-black/70" aria-describedby={undefined}>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Dialog.Title className="min-w-0 truncate text-base font-semibold text-white sm:text-lg">{name}</Dialog.Title>
          <Dialog.Close className="shrink-0 rounded-full border border-white/30 bg-black/40 p-3" aria-label={t('common.close')}><X className="h-5 w-5" /></Dialog.Close>
        </div>
        <motion.div key={photos[active]} data-motion="off" initial={{ opacity: reducedMotion ? 1 : 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="min-h-0 min-w-0 overflow-hidden">
          {image(photos[active], active, 'h-full w-full object-contain')}
        </motion.div>
        <div className="flex min-w-0 items-center justify-center gap-5">
          {photos.length > 1 && <button onClick={() => move(-1)} aria-label={t('gallery.previous')} className="shrink-0 rounded-full border border-white/40 bg-black/60 p-3"><ChevronLeft className="h-5 w-5 rtl:rotate-180" /></button>}
          <p className="text-center text-sm" aria-live="polite">{t('gallery.counter', { current: new Intl.NumberFormat(i18n.language).format(active + 1), total: new Intl.NumberFormat(i18n.language).format(photos.length) })}</p>
          {photos.length > 1 && <button onClick={() => move(1)} aria-label={t('gallery.next')} className="shrink-0 rounded-full border border-white/40 bg-black/60 p-3"><ChevronRight className="h-5 w-5 rtl:rotate-180" /></button>}
        </div>
        <div className="flex min-w-0 gap-2 overflow-x-auto" aria-label={t('gallery.thumbnails')}>
          {photos.map((src, index) => <button key={index} onClick={() => setSelected(index)} aria-label={t('gallery.photo', { name, count: index + 1 })} aria-pressed={active === index} className={`shrink-0 rounded-lg border-2 ${active === index ? 'border-white' : 'border-transparent opacity-60'}`}>{image(src, index, 'h-12 w-16 rounded-md object-cover')}</button>)}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
