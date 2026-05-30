import axios from 'axios';
import type { TranslateRequest, TranslateResult } from '../../core/interfaces/translate.js';
import { createHttpError } from '../../utils/http-error.js';

const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

/**
 * Translates text using the Google Translate unofficial API (no API key required).
 * Endpoint: GET translate.googleapis.com/translate_a/single?client=gtx
 */
export async function translateText(request: TranslateRequest): Promise<TranslateResult> {
  const { text, from = 'auto', to = 'en' } = request;

  if (!text?.trim()) {
    throw createHttpError(400, 'text is required.');
  }

  const { data } = await axios.get<unknown[][]>(GOOGLE_TRANSLATE_URL, {
    params: {
      client: 'gtx',
      sl: from,
      tl: to,
      dt: 't',
      q: text.trim(),
    },
    timeout: 8000,
  });

  if (!Array.isArray(data?.[0])) {
    throw createHttpError(502, 'Unexpected response from translation service.');
  }

  const translated = (data[0] as unknown[][])
    .map((chunk) => (typeof chunk[0] === 'string' ? chunk[0] : ''))
    .join('');

  return { translated, from, to };
}
