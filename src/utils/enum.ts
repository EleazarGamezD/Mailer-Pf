export function isEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): value is T[keyof T] {
  return typeof value === 'string' && Object.values(enumObject).includes(value as T[keyof T]);
}

export function parseEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
  fallback: T[keyof T],
): T[keyof T] {
  return isEnumValue(enumObject, value) ? value : fallback;
}
