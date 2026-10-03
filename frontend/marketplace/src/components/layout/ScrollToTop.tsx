import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      target?.scrollIntoView({ behavior: 'instant' });
    } else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 450);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <AnimatePresence>{visible && <motion.button
    key="scroll-top" initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })}
    aria-label={t('common.scrollToTop')}
    className="fixed end-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-forest text-white shadow-lg hover:bg-forest-deep"
    style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
  ><ArrowUp className="h-5 w-5" /></motion.button>}</AnimatePresence>;
}
