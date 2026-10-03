import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Server rendering checks only: no browser, network requests or account mutations.
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
globalThis.window = Object.assign(new EventTarget(), { location: { origin: 'http://localhost:5174' }, localStorage, sessionStorage });

const locales = ['en', 'fa-AF', 'ps-AF'];
const translations = await Promise.all(locales.map(locale => readFile(`src/i18n/locales/${locale}.json`, 'utf8').then(JSON.parse)));
function leafKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, item]) => typeof item === 'object' && !Array.isArray(item) ? leafKeys(item, `${prefix}${key}.`) : [`${prefix}${key}`]);
}
const englishKeys = leafKeys(translations[0]).sort();
for (let index = 1; index < translations.length; index++) assert.deepEqual(leafKeys(translations[index]).sort(), englishKeys, `${locales[index]} must have every English key`);

const server = await createServer({ envDir: false, define: { 'import.meta.env.VITE_PROVIDER_URL': JSON.stringify('') }, server: { middlewareMode: true }, appType: 'custom' });
let resetQueries = () => {};
try {
  const { default: i18n, getDirection } = await server.ssrLoadModule('/src/i18n/config.ts');
  const { store } = await server.ssrLoadModule('/src/redux/store.ts');
  const { default: CmsPage } = await server.ssrLoadModule('/src/pages/marketplace/static/CmsPage.tsx');
  const { default: Onboarding } = await server.ssrLoadModule('/src/pages/marketplace/static/ProviderOnboardingInfo.tsx');
  const { default: NotFound } = await server.ssrLoadModule('/src/pages/NotFound.tsx');
  const { PropertyGallery } = await server.ssrLoadModule('/src/components/ui/PropertyGallery.tsx');
  const { HeroSlider } = await server.ssrLoadModule('/src/components/ui/HeroSlider.tsx');
  const { default: PropertyDetails } = await server.ssrLoadModule('/src/pages/marketplace/PropertyDetails.tsx');
  const { marketplaceApi } = await server.ssrLoadModule('/src/services/marketplaceApi.ts');
  resetQueries = () => store.dispatch(marketplaceApi.util.resetApiState());
  const { providerUrl } = await server.ssrLoadModule('/src/utils/providerUrl.ts');
  const { translateCatalog } = await server.ssrLoadModule('/src/utils/translateCatalog.ts');
  const render = (component, path = '/') => renderToStaticMarkup(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: [path] }, component)));
  await store.dispatch(marketplaceApi.util.upsertQueryData('getPublishedProperty', 'kart-e-char', {
    id: 'mobile-property', slug: 'kart-e-char', name: 'Kabul stay', type: 'hotel', area: 'Kart-e-char', address: 'Kabul', description: '', rating: 4,
    reviewsCount: 0, fromPrice: 1800, currency: 'AFN', verified: true, amenities: [], images: ['/one.jpg', '/two.jpg'],
    checkInTime: '14:00', checkOutTime: '12:00', policies: '', latitude: 34.5, longitude: 69.1, reviews: [],
    rooms: [{ id: 'single-room', name: 'Single', capacity: 2, price: 1800, amenities: [] }],
  }));
  for (let index = 0; index < locales.length; index++) {
    await i18n.changeLanguage(locales[index]);
    assert.equal(getDirection(locales[index]), index ? 'rtl' : 'ltr');
    for (const slug of ['about', 'help', 'contact', 'terms', 'privacy', 'cancellation-policy']) {
      const page = translations[index].pages[slug];
      const html = render(React.createElement(CmsPage, { slug }));
      assert(html.includes(page.title), `${slug} title must render in ${locales[index]}`);
      for (const section of page.sections) assert(html.includes(section.title), `${slug} section must render in ${locales[index]}`);
      assert(!html.includes(translations[index].cms.unavailable), 'Known pages must be readable without CMS data');
    }
    const onboarding = render(React.createElement(Onboarding));
    assert(onboarding.includes('href="http://localhost:5173/signup"'), 'Onboarding must link to Provider signup');
    assert(onboarding.includes(translations[index].owners.start));
    const hero = render(React.createElement(HeroSlider));
    assert(hero.includes(translations[index].hero.slide1Title), 'Default hero headline must render in the selected language');
    assert(hero.includes(translations[index].hero.slide1Body), 'Default hero description must render in the selected language');
    assert(hero.includes(translations[index].home.searchCta), 'The search action must remain available in every language');
    assert(hero.includes(translations[index].hero.next), 'Slider navigation must remain translated');
    assert(hero.includes('/hero/stay-1.jpg'), 'Hero must have a local fallback image before API data arrives');
    const notFound = render(React.createElement(NotFound));
    assert(notFound.includes(translations[index].errors.backHome));
    assert(notFound.includes('text-ink'));
    assert(!notFound.includes('<header'), '404 must not render the site header');
    assert(!notFound.includes('<footer'), '404 must not render the site footer');
    const details = render(React.createElement(Routes, {}, React.createElement(Route, { path: '/property/:slug', element: React.createElement(PropertyDetails) })), '/property/kart-e-char');
    assert(details.includes('href="/book/kart-e-char/single-room"'), 'Room cards must preserve the complete reservation link');
    assert(details.includes(translations[index].catalog.single), 'Room type must remain translated');
    assert(!details.includes(`${i18n.t('property.capacity', { count: 2 })} ·`), 'No dangling separator when the room has no amenities');
    const images = Array.from({ length: 6 }, (_, photo) => `/photo-${photo}.jpg`);
    const gallery = render(React.createElement(PropertyGallery, { name: 'Kabul stay', images }));
    for (const image of images) assert(gallery.includes(image), 'All photos, including those beyond the first three, must be selectable');
    assert(gallery.includes('aria-pressed="true"'));
    assert(!gallery.includes('absolute bottom-4'), 'Photo button must be below the image rather than overlay it');
    const empty = render(React.createElement(PropertyGallery, { name: 'Empty stay', images: [] }));
    assert(empty.includes('<img'), 'Empty galleries must render a placeholder');
    assert.equal(translateCatalog('Wi-Fi', i18n.t.bind(i18n)), translations[index].catalog.wi_fi);
    assert.equal(translateCatalog('Custom owner room', i18n.t.bind(i18n)), 'Custom owner room');
  }
  assert.equal(providerUrl('/login'), 'http://localhost:5173/login');
  console.log('Passed: locale parity, 18 translated information pages, onboarding URLs, translated 404s, complete and empty galleries, catalog translation and custom-label fallback.');
} finally {
  resetQueries();
  await server.close();
}
