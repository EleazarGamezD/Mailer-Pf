import type { LocalizedText } from '../types/domain.js';

import { slugify } from './slugify.js';

export function getLocalizedField(
  input: Record<string, unknown>,
  fieldName: string,
): LocalizedText {
  const value = input[fieldName];

  if (!value || typeof value !== 'object') {
    return { es: '', en: '' };
  }

  const localized = value as Record<string, unknown>;

  return {
    es: typeof localized.es === 'string' ? localized.es.trim() : '',
    en: typeof localized.en === 'string' ? localized.en.trim() : '',
  };
}

export function resolveEnglishContent(localizedField: LocalizedText): LocalizedText {
  const es = localizedField.es.trim();
  const en = localizedField.en.trim();

  return {
    es,
    en: en || es,
  };
}

export function buildSlugFromLocalizedTitle(localizedTitle: LocalizedText, fallback = 'item'): string {
  const source = localizedTitle.es || localizedTitle.en || fallback;
  return slugify(source);
}
