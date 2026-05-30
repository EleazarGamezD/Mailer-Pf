export interface TranslateRequest {
  text: string;
  from?: string;
  to?: string;
}

export interface TranslateResult {
  translated: string;
  from: string;
  to: string;
}
