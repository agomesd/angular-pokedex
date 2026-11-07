import { pageForListIndex, pokemonListPage } from './list-page';
import { listEntryForId, pokemonListDirectory } from './pokemon-directory';

describe('pokemon list pages', () => {
  const directory = pokemonListDirectory([
    { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    { name: 'smeargle', url: 'https://pokeapi.co/api/v2/pokemon/235/' },
    { name: 'deoxys-attack', url: 'https://pokeapi.co/api/v2/pokemon/10001/' },
  ]);

  it('keeps the list index when a Pokémon id is not its position', () => {
    expect(directory[2]).toEqual({ name: 'deoxys-attack', id: 10001, index: 2 });
    expect(listEntryForId(directory, 1026)).toBeNull();
  });

  it('maps a list index onto the current page size', () => {
    expect(pageForListIndex(0, 20)).toBe(1);
    expect(pageForListIndex(234, 20)).toBe(12);
    expect(pageForListIndex(1025, 20)).toBe(52);
    expect(pokemonListPage(235, 20)).toBe(12);
  });

  it('pages a form by its list position instead of its id', () => {
    const entry = listEntryForId(directory, 10001);
    expect(pageForListIndex(entry!.index, 20)).toBe(1);
  });
});
