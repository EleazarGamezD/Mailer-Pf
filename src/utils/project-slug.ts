import type { LocalizedText, ProjectDocument } from '../core/interfaces/domain.js';

import { buildSlugFromLocalizedTitle } from './content.helpers.js';

type ProjectSlugExistsHandler = (slug: string) => Promise<ProjectDocument | null>;

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
