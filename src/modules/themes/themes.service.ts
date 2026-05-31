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

function lightenToBackground(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(s, 20), Math.max(l, 88));
}

function darkenForText(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.max(s, 20), Math.min(l, 28));
}

function desaturateForBorder(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(s, 15), Math.min(Math.max(l, 72), 82));
}

// ---------------------------------------------------------------------------

export async function generatePalette(hex: string, mode: string): Promise<Partial<ThemeColors>> {
  const cleanHex = hex.replace('#', '').toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(cleanHex)) {
    throw createHttpError(400, 'Invalid hex color. Expected 6-character hex without #.');
  }

  const paletteMode: PaletteMode = VALID_PALETTE_MODES.includes(mode as PaletteMode)
    ? (mode as PaletteMode)
    : 'analogic-complement';

  const url = `https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=${paletteMode}&count=5`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw createHttpError(502, `Color API responded with ${response.status}.`);
  }

  const data = await response.json() as { colors?: Array<{ hex?: { value?: string } }> };
  const palette = (data.colors ?? []).map((c) => c.hex?.value ?? '#cccccc');

  if (palette.length < 5) {
    throw createHttpError(502, 'Color API returned fewer than 5 colors.');
  }

  return {
    baseColor:       palette[0],
    veryLightGray:   lightenToBackground(palette[1]),
    darkGray:        darkenForText(palette[2]),
    mediumGray:      palette[3],
    lightMediumGray: desaturateForBorder(palette[4]),
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
