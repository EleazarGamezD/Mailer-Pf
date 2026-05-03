export function toDisplayCapitalization(value: string): string {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (!normalized) {
    return '';
  }

  return normalized
    .split(/(\s+)/u)
    .map((token) => {
      if (!token.trim()) {
        return token;
      }

      return token
        .split(/([/_-])/u)
        .map((segment) => {
          if (segment === '/' || segment === '_' || segment === '-') {
            return segment;
          }

          return capitalizeSegment(segment);
        })
        .join('');
    })
    .join('');
}

function capitalizeSegment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const first = trimmed.charAt(0).toUpperCase();
  const rest = /[A-Z]/u.test(trimmed.slice(1)) ? trimmed.slice(1) : trimmed.slice(1).toLowerCase();

  return `${first}${rest}`;
}
