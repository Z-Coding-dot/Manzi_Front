import { useEffect, type ReactNode } from 'react';
import { inView, useAnimate, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/** Shared reveals cover every page, including content arriving after an API call. */
export function AnimatedContent({ children, className }: { children: ReactNode; className?: string }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const { pathname } = useLocation();
  useEffect(() => {
    const root = scope.current;
    if (!root || reducedMotion) return;
    const seen = new WeakSet<Element>();
    const stops: (() => void)[] = [];
    const register = () => {
      const targets = root.querySelectorAll<HTMLElement>('h1, h2, h3, p, img, article, [data-motion-card]');
      targets.forEach((element, index) => {
        if (seen.has(element) || element.closest('[data-motion="off"], .leaflet-container')) return;
        seen.add(element);
        stops.push(inView(element, () => {
          // Animate visible content without hiding the rest of the page beforehand.
          void animate(element, { opacity: [0.35, 1], y: [10, 0] }, { duration: 0.4, delay: Math.min(index % 4 * 0.04, 0.12), ease: 'easeOut' });
        }, { amount: 0.15 }));
      });
    };
    register();
    const observer = new MutationObserver(register);
    observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); stops.forEach(stop => stop()); };
  }, [pathname, reducedMotion, scope, animate]);
  return <div ref={scope} className={className}>{children}</div>;
}
