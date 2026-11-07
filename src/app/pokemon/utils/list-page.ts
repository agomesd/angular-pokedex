export const DEFAULT_POKEMON_PAGE_SIZE = 20;

export function pokemonListPage(id: number, pageSize = DEFAULT_POKEMON_PAGE_SIZE): number {
  return pageForListIndex(Math.max(id, 1) - 1, pageSize);
}

export function pageForListIndex(index: number, pageSize = DEFAULT_POKEMON_PAGE_SIZE): number {
  return Math.floor(index / pageSize) + 1;
}

export function listPageQuery(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
