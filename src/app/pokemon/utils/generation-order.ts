const ROMAN_VALUES: Record<string, number> = {
  i: 1,
  v: 5,
  x: 10,
  l: 50,
  c: 100,
  d: 500,
  m: 1000,
};

export function generationsNewestFirst(keys: string[]): string[] {
  return [...keys].sort((a, b) => compareGenerations(a, b, 'desc'));
}

export function generationsOldestFirst(keys: string[]): string[] {
  return [...keys].sort((a, b) => compareGenerations(a, b, 'asc'));
}

export function generationLabel(key: string): string {
  const roman = generationRoman(key);
  return roman ? `Generation ${roman}` : key;
}

export function generationNumeral(key: string): string {
  return generationRoman(key) ?? key;
}

function generationRoman(key: string): string | null {
  const roman = /^generation-(.+)$/i.exec(key)?.[1];
  return roman ? roman.toUpperCase() : null;
}

function compareGenerations(a: string, b: string, direction: 'asc' | 'desc'): number {
  const left = generationRank(a);
  const right = generationRank(b);
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === 'asc' ? left - right : right - left;
}

function generationRank(key: string): number | null {
  const roman = generationRoman(key)?.toLowerCase();
  if (!roman) return null;

  const numerals = [...roman];

  // The reduce walks left to right and compares each numeral with the one after it
  // If the current numeral is less than the next, it subtracts the value (e.g., IV = 4, not 6)
  // Otherwise, it adds the value (e.g., VI = 6)
  return numerals.reduce((total, numeral, index) => {
    const value = ROMAN_VALUES[numeral] ?? 0;
    const next = ROMAN_VALUES[numerals[index + 1] ?? ''] ?? 0;
    return total + (value < next ? -value : value);
  }, 0);
}
