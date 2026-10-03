import type { TFunction } from 'i18next';

// Translate the standard catalog while preserving custom owner-authored labels.
export function translateCatalog(value: string, t: TFunction) {
  const key = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return t(`catalog.${key}`, { defaultValue: value });
}
