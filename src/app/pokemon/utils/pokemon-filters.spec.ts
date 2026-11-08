import { matchesFilter, matchesTeam, parsePokemonFilterCatalog, type PokemonFilterSelection } from './pokemon-filters';

const species = `id,identifier,generation_id,is_legendary,is_mythical
1,bulbasaur,1,0,0
3,venusaur,1,0,0
4,charmander,1,0,0
6,charizard,1,0,0
146,moltres,1,1,0
151,mew,1,0,1
152,chikorita,2,0,0
`;

const pokemon = `id,identifier,species_id
1,bulbasaur,1
3,venusaur,3
4,charmander,4
6,charizard,6
10034,charizard-mega-x,6
146,moltres,146
151,mew,151
152,chikorita,152
`;

const types = `id,identifier
1,normal
3,flying
4,poison
9,dragon
10,fire
12,grass
14,psychic
10001,unknown
10002,shadow
99,stellar
`;

const pokemonTypes = `pokemon_id,type_id,slot
1,4,2
1,12,1
3,12,1
3,4,2
4,10,1
4,10001,2
6,10,1
6,3,2
10034,10,1
10034,9,2
146,10,1
146,3,2
151,14,1
151,10002,2
152,12,1
152,4,2
`;

describe('pokemon filters', () => {
  const catalog = parsePokemonFilterCatalog({ species, pokemon, types, pokemonTypes });

  function traits(name: string) {
    return catalog.byName.get(name);
  }

  it('keeps a form with its species generation and its own types', () => {
    expect(traits('bulbasaur')).toEqual({
      types: ['grass', 'poison'],
      generation: 'generation-i',
      legendary: false,
      mythical: false,
    });
    expect(traits('charizard-mega-x')).toEqual({
      types: ['fire', 'dragon'],
      generation: 'generation-i',
      legendary: false,
      mythical: false,
    });
    expect(traits('moltres')?.legendary).toBe(true);
    expect(traits('moltres')?.mythical).toBe(false);
    expect(traits('mew')?.legendary).toBe(false);
    expect(traits('mew')?.mythical).toBe(true);
  });

  it('drops unknown, shadow, and stellar types', () => {
    expect(traits('charmander')?.types).toEqual(['fire']);
    expect(traits('charizard')?.types).toEqual(['fire', 'flying']);
    expect(traits('mew')?.types).toEqual(['psychic']);
  });

  it('matches any selected type or generation, and requires every active group', () => {
    const fireOrGrass: PokemonFilterSelection = {
      types: ['fire', 'grass'],
      generations: ['generation-i'],
      legendary: 'not-legendary',
      mythical: 'all',
      team: 'all',
    };

    expect(matchesFilter(traits('bulbasaur'), fireOrGrass)).toBe(true);
    expect(matchesFilter(traits('charmander'), fireOrGrass)).toBe(true);
    expect(matchesFilter(traits('moltres'), fireOrGrass)).toBe(false);
    expect(matchesFilter(traits('chikorita'), fireOrGrass)).toBe(false);
    expect(matchesFilter(undefined, fireOrGrass)).toBe(false);
  });

  it('treats mythicals as not legendary', () => {
    const legendary: PokemonFilterSelection = {
      types: [],
      generations: [],
      legendary: 'legendary',
      mythical: 'all',
      team: 'all',
    };
    expect(matchesFilter(traits('moltres'), legendary)).toBe(true);
    expect(matchesFilter(traits('mew'), legendary)).toBe(false);
  });

  it('filters mythicals separately from legendaries', () => {
    const mythical: PokemonFilterSelection = {
      types: [],
      generations: [],
      legendary: 'all',
      mythical: 'mythical',
      team: 'all',
    };
    expect(matchesFilter(traits('mew'), mythical)).toBe(true);
    expect(matchesFilter(traits('moltres'), mythical)).toBe(false);
    expect(matchesFilter(traits('bulbasaur'), mythical)).toBe(false);
  });

  it('matches team membership only when that filter is set', () => {
    expect(matchesTeam(true, 'all')).toBe(true);
    expect(matchesTeam(false, 'all')).toBe(true);
    expect(matchesTeam(true, 'on-team')).toBe(true);
    expect(matchesTeam(false, 'on-team')).toBe(false);
    expect(matchesTeam(false, 'not-on-team')).toBe(true);
    expect(matchesTeam(true, 'not-on-team')).toBe(false);
  });
});
