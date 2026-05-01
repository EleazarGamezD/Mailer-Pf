import type { LocalizedText } from '../core/interfaces/domain.js';
import { isJsonObject } from '../core/interfaces/json.js';
import type { JsonObject } from '../core/interfaces/json.js';

import { slugify } from './slugify.js';

export function getLocalizedField(
  input: JsonObject,
  fieldName: string,
): LocalizedText {
  const value = input[fieldName];

  if (!isJsonObject(value)) {
    return { es: '', en: '' };
  }

  return {
    es: typeof value.es === 'string' ? value.es.trim() : '',
    en: typeof value.en === 'string' ? value.en.trim() : '',
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
