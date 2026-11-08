import {
  EMPTY_POKEMON_FILTERS,
  POKEMON_FILTER_GENERATIONS,
  POKEMON_FILTER_TYPES,
  type PokemonFilterSelection,
} from './pokemon-filters';

const TYPES = new Set<string>(POKEMON_FILTER_TYPES);
const GENERATIONS = new Set<string>(POKEMON_FILTER_GENERATIONS);
const BROWSE_QUERY_KEYS = ['page', 'types', 'generations', 'legendary', 'mythical', 'team'] as const;

export type BrowseQuery = {
  page: string | null;
  types: string | null;
  generations: string | null;
  legendary: string | null;
  mythical: string | null;
  team: string | null;
};

export function hasBrowseQuery(params: { has(name: string): boolean }): boolean {
  return BROWSE_QUERY_KEYS.some((key) => params.has(key));
}

export function filtersFromQuery(params: { get(name: string): string | null }): PokemonFilterSelection {
  return {
    types: names(params.get('types'), TYPES),
    generations: names(params.get('generations'), GENERATIONS),
    legendary: oneOf(params.get('legendary'), ['legendary', 'not-legendary'] as const, 'all'),
    mythical: oneOf(params.get('mythical'), ['mythical', 'not-mythical'] as const, 'all'),
    team: oneOf(params.get('team'), ['on-team', 'not-on-team'] as const, 'all'),
  };
}

export function browseQuery(page: number, filters: PokemonFilterSelection): BrowseQuery {
  return {
    page: page > 1 ? String(page) : null,
    types: filters.types.length > 0 ? filters.types.join(',') : null,
    generations: filters.generations.length > 0 ? filters.generations.join(',') : null,
    legendary: filters.legendary === 'all' ? null : filters.legendary,
    mythical: filters.mythical === 'all' ? null : filters.mythical,
    team: filters.team === 'all' ? null : filters.team,
  };
}

export function browseQueryMatches(params: { get(name: string): string | null }, next: BrowseQuery): boolean {
  return (Object.keys(next) as (keyof BrowseQuery)[]).every((key) => (params.get(key) ?? null) === next[key]);
}

export function sanitizeFilters(value: unknown): PokemonFilterSelection {
  if (!value || typeof value !== 'object') return EMPTY_POKEMON_FILTERS;
  const raw = value as Partial<Record<keyof PokemonFilterSelection, unknown>>;
  return filtersFromQuery({
    get(name: string): string | null {
      if (name === 'types' || name === 'generations') {
        const items = raw[name];
        return Array.isArray(items) ? items.filter((item) => typeof item === 'string').join(',') : null;
      }
      if (name === 'legendary' || name === 'mythical' || name === 'team') {
        const item = raw[name];
        return typeof item === 'string' ? item : null;
      }
      return null;
    },
  });
}

export function sanitizePage(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 1;
}

function names(value: string | null, allowed: ReadonlySet<string>): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of value.split(',')) {
    const name = part.trim();
    if (!allowed.has(name) || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }
  return result;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value != null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
