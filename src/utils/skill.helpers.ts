import type { ContentDocument, LocalizedText } from '../core/interfaces/domain.js';

import { buildSlugFromLocalizedTitle } from './content.helpers.js';
import { toDisplayCapitalization } from './text-format.js';

type SkillFinder = (slug: string) => Promise<ContentDocument | null>;

export function normalizeTechSkillLabel(value: string): LocalizedText {
  const normalized = toDisplayCapitalization(value);

  return {
    es: normalized,
    en: normalized,
  };
}

export async function buildUniqueTechSkillSlug(
  label: LocalizedText,
  findSkillBySlug: SkillFinder,
  currentSkillId?: string,
): Promise<string> {
  const baseSlug = buildSlugFromLocalizedTitle(label, 'skill');
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingSkill = await findSkillBySlug(candidate);

    if (!existingSkill || String(existingSkill._id) === currentSkillId) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
