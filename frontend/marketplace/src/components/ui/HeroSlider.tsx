import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Pause, Play, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';
import { useGetCmsBannersQuery, useGetPublishedPropertiesQuery } from '@/services/marketplaceApi';

const DEFAULT_IMAGES = ['/hero/stay-1.jpg', '/hero/stay-2.jpg', '/hero/stay-3.jpg'];

export function HeroSlider() {
  const { t, i18n } = useTranslation();
  const { currentData: banners = [] } = useGetCmsBannersQuery(i18n.language);
  const { data: properties = [] } = useGetPublishedPropertiesQuery();
  const propertyPhotos = [...new Set(properties.flatMap(property => property.images).filter(Boolean))];
  const slides = banners.length ? banners.map((banner, index) => ({
    id: banner.id, image: banner.image || propertyPhotos[index] || DEFAULT_IMAGES[index % 3],
    title: banner.title || t('home.heroTitle'), body: banner.body || t('home.heroSubtitle'),
  })) : DEFAULT_IMAGES.map((fallback, index) => ({
    id: `stay-${index}`, image: propertyPhotos[index] || fallback,
    title: t(`hero.slide${index + 1}Title`), body: t(`hero.slide${index + 1}Body`),
  }));
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const active = index % slides.length;
  const slide = slides[active];
  const autoPlay = !paused && !hovered && !focused && !reducedMotion && pageVisible && slides.length > 1;
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % slides.length), 500);
    return () => window.clearInterval(timer);
  }, [autoPlay, slides.length]);
  const choose = (next: number) => { setIndex((next + slides.length) % slides.length); setPaused(true); };
  return <section
    data-motion="off" role="region" aria-roledescription={t('hero.carousel')} aria-label={t('hero.label')}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    className="relative isolate overflow-hidden bg-forest-deep"
  >
    <AnimatePresence initial={false}>
      <motion.div key={slide.id + slide.image} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 1 }} className="pointer-events-none absolute inset-0 -z-20">
        <img src={slide.image} alt="" className="h-full w-full object-cover" fetchPriority={active === 0 ? 'high' : 'auto'} onError={event => { const fallback = new URL(DEFAULT_IMAGES[active % 3], window.location.origin).href; if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }} />
      </motion.div>
    </AnimatePresence>
    <div className="pointer-events-none absolute inset-0 -z-10 bg-black/60" />
    <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-forest-deep via-forest-deep/25 to-transparent" />
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm"><MapPin className="h-4 w-4" />{t('home.heroEyebrow')}</p>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-white"><ShieldCheck className="h-4 w-4" />{t('hero.trust')}</span>
      </div>
      <div className="max-w-3xl pb-8 pt-8 sm:pb-12 sm:pt-12" aria-live={autoPlay ? 'off' : 'polite'} aria-atomic="true">
        <h1 className="font-display min-h-[3.5em] text-4xl leading-[1.15] text-white [text-shadow:0_2px_12px_rgb(0_0_0/35%)] sm:min-h-[2.4em] sm:text-5xl lg:text-6xl">{slide.title}</h1>
        <p className="mt-5 min-h-[5.25em] max-w-2xl text-base leading-7 text-white sm:min-h-[3.5em] sm:text-lg">{slide.body}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <p className="text-xs font-medium text-white/85">{t('hero.discover')}</p>
        {slides.length > 1 && <div className="flex max-w-full flex-wrap items-center gap-2" aria-label={t('hero.controls')}>
          <button type="button" onClick={() => choose(active - 1)} aria-label={t('hero.previous')} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white hover:bg-white/20"><ChevronLeft className="h-5 w-5 rtl:rotate-180" /></button>
          {slides.map((item, position) => <button key={item.id} type="button" onClick={() => choose(position)} aria-label={t('hero.goTo', { count: position + 1 })} aria-pressed={position === active} className="flex h-11 min-w-7 items-center justify-center"><span className={`block h-2 rounded-full transition-all ${position === active ? 'w-7 bg-white' : 'w-2 bg-white/50'}`} /></button>)}
          <button type="button" onClick={() => choose(active + 1)} aria-label={t('hero.next')} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white hover:bg-white/20"><ChevronRight className="h-5 w-5 rtl:rotate-180" /></button>
          {!reducedMotion && <button type="button" onClick={() => setPaused(current => !current)} aria-label={t(paused ? 'hero.play' : 'hero.pause')} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white hover:bg-white/20">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>}
        </div>}
      </div>
      <div className="relative rounded-2xl bg-white/15 p-1.5 shadow-2xl backdrop-blur-sm"><SearchBar /></div>
    </div>
  </section>;
}
