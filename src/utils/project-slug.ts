import type { LocalizedText } from '../core/interfaces/domain.js';
import type { ProjectSlugExistsHandler } from '../core/types/slug.js';

import { buildSlugFromLocalizedTitle } from './content.helpers.js';

export async function buildUniqueProjectSlug(
  title: LocalizedText,
  findProjectBySlug: ProjectSlugExistsHandler,
  currentProjectId?: string,
): Promise<string> {
  const baseSlug = buildSlugFromLocalizedTitle(title, 'project');
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingProject = await findProjectBySlug(candidate);

    if (!existingProject || String(existingProject._id) === currentProjectId) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
