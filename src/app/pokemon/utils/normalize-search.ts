export function normalizeSearch(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed.replace(/^0+(?=\d)/, '');
}
