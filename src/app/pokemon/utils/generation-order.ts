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
  return [...keys].sort((a, b) => generationNumber(b) - generationNumber(a));
}

function generationNumber(key: string): number {
  // Extract the generation roman numeral from the key (ie generation-i -> i, generation-ii -> ii, etc.)
  const roman = /^generation-(.+)$/i.exec(key)?.[1];
  // If the generation is not a roman numeral, return 0 and sort last
  if (!roman) return 0;

  const numerals = [...roman.toLowerCase()];

  // The reduce walks left to right and compares each numeral with the one after it
  // If the current numeral is less than the next, it subtracts the value (e.g., IV = 4, not 6)
  // Otherwise, it adds the value (e.g., VI = 6)
  return numerals.reduce((total, numeral, index) => {
    const value = ROMAN_VALUES[numeral] ?? 0;
    const next = ROMAN_VALUES[numerals[index + 1] ?? ''] ?? 0;
    return total + (value < next ? -value : value);
  }, 0);
}
