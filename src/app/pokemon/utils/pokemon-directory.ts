export type PokemonListEntry = {
  name: string;
  id: number;
  index: number;
};

export function pokemonListDirectory(
  results: readonly { name: string; url: string }[],
): PokemonListEntry[] {
  return results.flatMap((result, index) => {
    const id = pokemonIdFromResourceUrl(result.url);
    return Number.isInteger(id) ? [{ name: result.name, id, index }] : [];
  });
}

export function pokemonIdFromResourceUrl(url: string): number {
  const id = Number(url.match(/\/pokemon\/(\d+)\/?$/)?.[1]);
  return Number.isInteger(id) ? id : Number.NaN;
}

export function listEntryForId(
  entries: readonly PokemonListEntry[],
  id: number,
): PokemonListEntry | null {
  return entries.find((entry) => entry.id === id) ?? null;
}

export function listEntryForName(
  entries: readonly PokemonListEntry[],
  name: string,
): PokemonListEntry | null {
  return entries.find((entry) => entry.name === name) ?? null;
}
