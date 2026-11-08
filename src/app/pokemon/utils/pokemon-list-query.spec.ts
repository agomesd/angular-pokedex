import { EMPTY_POKEMON_FILTERS, type PokemonFilterSelection } from './pokemon-filters';
import { browseQuery, browseQueryMatches, filtersFromQuery, hasBrowseQuery, sanitizeFilters, sanitizePage } from './pokemon-list-query';

describe('pokemon list query', () => {
  const filters: PokemonFilterSelection = {
    types: ['fire', 'water'],
    generations: ['generation-i'],
    legendary: 'legendary',
    mythical: 'not-mythical',
    team: 'on-team',
  };

  function params(values: Record<string, string | null>): { get(name: string): string | null; has(name: string): boolean } {
    return {
      get: (name) => values[name] ?? null,
      has: (name) => Object.prototype.hasOwnProperty.call(values, name) && values[name] != null,
    };
  }

  it('round-trips an active browse', () => {
    const query = browseQuery(2, filters);
    expect(query).toEqual({
      page: '2',
      types: 'fire,water',
      generations: 'generation-i',
      legendary: 'legendary',
      mythical: 'not-mythical',
      team: 'on-team',
    });
    expect(filtersFromQuery(params(query))).toEqual(filters);
    expect(browseQueryMatches(params(query), query)).toBe(true);
  });

  it('omits the page and filters that are not narrowing the list', () => {
    expect(browseQuery(1, EMPTY_POKEMON_FILTERS)).toEqual({
      page: null,
      types: null,
      generations: null,
      legendary: null,
      mythical: null,
      team: null,
    });
    expect(hasBrowseQuery(params({}))).toBe(false);
    expect(hasBrowseQuery(params({ legendary: 'legendary' }))).toBe(true);
  });

  it('drops unknown filter values', () => {
    expect(
      filtersFromQuery(
        params({
          types: 'fire,shadow,fire',
          generations: 'generation-x,generation-ii',
          legendary: 'mythical',
          mythical: 'legendary',
          team: 'maybe',
        }),
      ),
    ).toEqual({
      ...EMPTY_POKEMON_FILTERS,
      types: ['fire'],
      generations: ['generation-ii'],
    });
  });

  it('sanitizes a stored browse', () => {
    expect(sanitizePage(2)).toBe(2);
    expect(sanitizePage(0)).toBe(1);
    expect(sanitizePage('2')).toBe(1);
    expect(sanitizeFilters({ legendary: 'legendary', types: ['bug', 'nope'] })).toEqual({
      ...EMPTY_POKEMON_FILTERS,
      types: ['bug'],
      legendary: 'legendary',
    });
    expect(sanitizeFilters(null)).toEqual(EMPTY_POKEMON_FILTERS);
  });
});
