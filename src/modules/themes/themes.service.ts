import type { ThemeDocument, ThemePayload, ThemeColors } from '../../core/interfaces/theme.js';
import { DEFAULT_THEME_COLORS } from '../../core/interfaces/theme.js';
import { ThemesRepository } from '../../repositories/themes.repository.js';
import { createHttpError } from '../../utils/http-error.js';
import { parseObjectId } from '../../utils/object-id.js';

const themesRepository = new ThemesRepository();

// ---------------------------------------------------------------------------
// Palette generation helpers (color manipulation utilities)
// ---------------------------------------------------------------------------

type PaletteMode = 'analogic-complement' | 'triad' | 'quad' | 'complement' | 'analogic';

const VALID_PALETTE_MODES: PaletteMode[] = [
  'analogic-complement',
  'triad',
  'quad',
  'complement',
  'analogic',
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const hN = h / 360, sN = s / 100, lN = l / 100;
  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;
  const hue2rgb = (t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const rr = Math.round(hue2rgb(hN + 1 / 3) * 255);
  const gg = Math.round(hue2rgb(hN) * 255);
  const bb = Math.round(hue2rgb(hN - 1 / 3) * 255);
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeHue(hue: number): number {
  const normalized = hue % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function mixHues(firstHue: number, secondHue: number, weight = 0.5): number {
  const firstRadians = (normalizeHue(firstHue) * Math.PI) / 180;
  const secondRadians = (normalizeHue(secondHue) * Math.PI) / 180;
  const x = Math.cos(firstRadians) * weight + Math.cos(secondRadians) * (1 - weight);
  const y = Math.sin(firstRadians) * weight + Math.sin(secondRadians) * (1 - weight);
  return normalizeHue(Math.round((Math.atan2(y, x) * 180) / Math.PI));
}

function createSeededRandom(seedValue: string): () => number {
  let seed = 0;

  for (let index = 0; index < seedValue.length; index += 1) {
    seed = (seed * 31 + seedValue.charCodeAt(index)) >>> 0;
  }

  if (seed === 0) {
    seed = 0x9e3779b9;
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function varyHue(hex: string, random: () => number, range: number): number {
  const [h] = hexToHsl(hex);
  const offset = (random() * 2 - 1) * range;
  return normalizeHue(Math.round(h + offset));
}

function buildBackground(baseHex: string, supportHex: string, random: () => number): string {
  const [baseHue, baseSaturation, baseLightness] = hexToHsl(baseHex);
  const [supportHue] = hexToHsl(supportHex);
  const hue = normalizeHue(mixHues(baseHue, supportHue, 0.68) + Math.round((random() * 2 - 1) * 6));
  return hslToHex(
    hue,
    clamp(Math.round(baseSaturation * 0.14), 8, 18),
    clamp(Math.round(94 + random() * 2 + baseLightness * 0.02), 93, 97),
  );
}

function buildDarkText(baseHex: string, supportHex: string, random: () => number): string {
  const [baseHue, , baseLightness] = hexToHsl(baseHex);
  const [supportHue, supportSaturation, supportLightness] = hexToHsl(supportHex);
  const hue = normalizeHue(mixHues(supportHue, baseHue, 0.72) + Math.round((random() * 2 - 1) * 8));
  return hslToHex(
    hue,
    clamp(Math.round(supportSaturation * 0.26), 10, 24),
    clamp(Math.round(18 + random() * 6 + (supportLightness + baseLightness) * 0.03), 18, 28),
  );
}

function buildMediumText(baseHex: string, supportHex: string, random: () => number): string {
  const [baseHue, baseSaturation, baseLightness] = hexToHsl(baseHex);
  const [supportHue, supportSaturation, supportLightness] = hexToHsl(supportHex);
  const hue = normalizeHue(mixHues(baseHue, supportHue, 0.5) + Math.round((random() * 2 - 1) * 10));
  return hslToHex(
    hue,
    clamp(Math.round((baseSaturation * 0.16 + supportSaturation * 0.12) / 1.1), 10, 22),
    clamp(Math.round(44 + random() * 8 + (baseLightness + supportLightness) * 0.05), 44, 58),
  );
}

function buildBorder(baseHex: string, supportHex: string, random: () => number): string {
  const [baseHue, baseSaturation, baseLightness] = hexToHsl(baseHex);
  const [supportHue, supportSaturation, supportLightness] = hexToHsl(supportHex);
  const hue = normalizeHue(mixHues(baseHue, supportHue, 0.54) + Math.round((random() * 2 - 1) * 6));
  return hslToHex(
    hue,
    clamp(Math.round((baseSaturation * 0.12 + supportSaturation * 0.1) / 1.05), 8, 18),
    clamp(Math.round(78 + random() * 5 + (baseLightness + supportLightness) * 0.03), 78, 86),
  );
}

function pickPaletteColor(palette: string[], random: () => number, offset = 0): string {
  const safePalette = palette.length > 0 ? palette : ['#c84b31'];
  const index = (Math.floor(random() * safePalette.length) + offset) % safePalette.length;
  return safePalette[index]!;
}

// ---------------------------------------------------------------------------

export async function generatePalette(hex: string, mode: string, seed = ''): Promise<Partial<ThemeColors>> {
  const cleanHex = hex.replace('#', '').toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(cleanHex)) {
    throw createHttpError(400, 'Invalid hex color. Expected 6-character hex without #.');
  }

  const paletteMode: PaletteMode = VALID_PALETTE_MODES.includes(mode as PaletteMode)
    ? (mode as PaletteMode)
    : 'analogic-complement';

  const url = `https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=${paletteMode}&count=8`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw createHttpError(502, `Color API responded with ${response.status}.`);
  }

  const data = await response.json() as { colors?: Array<{ hex?: { value?: string } }> };
  const palette = (data.colors ?? []).map((c) => c.hex?.value ?? '#cccccc');

  if (palette.length < 3) {
    throw createHttpError(502, 'Color API returned too few colors.');
  }

  const random = createSeededRandom(`${cleanHex}:${paletteMode}:${seed || Date.now().toString()}`);
  const baseColor = pickPaletteColor(palette, random);
  const supportColor = pickPaletteColor(palette, random, 1);

  return {
    baseColor,
    veryLightGray: buildBackground(baseColor, supportColor, random),
    darkGray: buildDarkText(baseColor, supportColor, random),
    mediumGray: buildMediumText(baseColor, supportColor, random),
    lightMediumGray: buildBorder(baseColor, supportColor, random),
  };
}

// ---------------------------------------------------------------------------

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
    colors: {
      ...DEFAULT_THEME_COLORS,
      ...Object.fromEntries(
        Object.entries(payload.colors ?? {})
          .filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
          .map(([k, v]) => [k, (v as string).trim()])
      ),
    },
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
  if (payload.colors && Object.keys(payload.colors).length > 0) {
    update.colors = {
      ...DEFAULT_THEME_COLORS,
      ...existing.colors,
      ...Object.fromEntries(
        Object.entries(payload.colors)
          .filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
          .map(([k, v]) => [k, (v as string).trim()])
      ),
    };
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
