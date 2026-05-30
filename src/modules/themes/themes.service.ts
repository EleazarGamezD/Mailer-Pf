import type { ThemeDocument, ThemePayload } from '../../core/interfaces/theme.js';
import { ThemesRepository } from '../../repositories/themes.repository.js';
import { createHttpError } from '../../utils/http-error.js';
import { parseObjectId } from '../../utils/object-id.js';

const themesRepository = new ThemesRepository();

export async function listThemes(): Promise<ThemeDocument[]> {
  return themesRepository.find({}, { sort: { createdAt: 1 } });
}

export async function getActiveTheme(): Promise<ThemeDocument | null> {
  return themesRepository.findOne({ active: true });
}

export async function createTheme(payload: ThemePayload): Promise<ThemeDocument> {
  if (!payload.name?.trim()) throw createHttpError(400, 'Theme name is required.');
  if (!payload.colors?.baseColor?.trim()) throw createHttpError(400, 'baseColor is required.');

  const now = new Date();
  const doc: Omit<ThemeDocument, '_id'> = {
    name: payload.name.trim(),
    active: false,
    colors: { baseColor: payload.colors.baseColor.trim() },
    createdAt: now,
    updatedAt: now,
  };

  const result = await themesRepository.create(doc as ThemeDocument);
  return { ...doc, _id: result.insertedId };
}

export async function updateTheme(id: string, payload: ThemePayload): Promise<ThemeDocument> {
  const objectId = parseObjectId(id);
  const existing = await themesRepository.findOne({ _id: objectId });
  if (!existing) throw createHttpError(404, 'Theme not found.');

  const update: Partial<ThemeDocument> = { updatedAt: new Date() };
  if (payload.name?.trim()) update.name = payload.name.trim();
  if (payload.colors?.baseColor?.trim()) {
    update.colors = { baseColor: payload.colors.baseColor.trim() };
  }

  const updated = await themesRepository.updateById(objectId, update);
  if (!updated) throw createHttpError(404, 'Theme not found.');
  return updated;
}

export async function deleteTheme(id: string): Promise<void> {
  const objectId = parseObjectId(id);
  const existing = await themesRepository.findOne({ _id: objectId });
  if (!existing) throw createHttpError(404, 'Theme not found.');
  if (existing.active) throw createHttpError(400, 'Cannot delete the active theme. Activate another theme first.');
  await themesRepository.deleteById(objectId);
}

export async function activateTheme(id: string): Promise<ThemeDocument> {
  const objectId = parseObjectId(id);
  const existing = await themesRepository.findOne({ _id: objectId });
  if (!existing) throw createHttpError(404, 'Theme not found.');

  await themesRepository.deactivateAll();
  const updated = await themesRepository.updateById(objectId, { active: true, updatedAt: new Date() });
  if (!updated) throw createHttpError(404, 'Theme not found after activate.');
  return updated;
}
