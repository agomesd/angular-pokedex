export const POKEMON_FILTER_TYPES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
] as const;

export const POKEMON_FILTER_GENERATIONS = [
  'generation-i',
  'generation-ii',
  'generation-iii',
  'generation-iv',
  'generation-v',
  'generation-vi',
  'generation-vii',
  'generation-viii',
  'generation-ix',
] as const;

const EXCLUDED_TYPES = new Set(['unknown', 'shadow', 'stellar']);

export type LegendaryFilter = 'all' | 'legendary' | 'not-legendary';
export type MythicalFilter = 'all' | 'mythical' | 'not-mythical';
export type TeamFilter = 'all' | 'on-team' | 'not-on-team';

export type PokemonFilterSelection = {
  types: string[];
  generations: string[];
  legendary: LegendaryFilter;
  mythical: MythicalFilter;
  team: TeamFilter;
};

export type PokemonFilterTraits = {
  types: string[];
  generation: string;
  legendary: boolean;
  mythical: boolean;
};

export type PokemonFilterCatalog = {
  byName: Map<string, PokemonFilterTraits>;
};

export const EMPTY_POKEMON_FILTERS: PokemonFilterSelection = {
  types: [],
  generations: [],
  legendary: 'all',
  mythical: 'all',
  team: 'all',
};

export function selectionIsActive(selection: PokemonFilterSelection): boolean {
  return (
    selection.types.length > 0 ||
    selection.generations.length > 0 ||
    selection.legendary !== 'all' ||
    selection.mythical !== 'all' ||
    selection.team !== 'all'
  );
}

export function sameSelection(a: PokemonFilterSelection, b: PokemonFilterSelection): boolean {
  return (
    a.legendary === b.legendary &&
    a.mythical === b.mythical &&
    a.team === b.team &&
    sameStrings(a.types, b.types) &&
    sameStrings(a.generations, b.generations)
  );
}

export function matchesTeam(onTeam: boolean, filter: TeamFilter): boolean {
  if (filter === 'on-team') return onTeam;
  if (filter === 'not-on-team') return !onTeam;
  return true;
}

export function matchesFilter(
  traits: PokemonFilterTraits | undefined,
  selection: PokemonFilterSelection,
): boolean {
  if (!selectionIsActive(selection)) return traits != null;
  if (!traits) return false;
  if (selection.types.length > 0 && !selection.types.some((type) => traits.types.includes(type))) return false;
  if (selection.generations.length > 0 && !selection.generations.includes(traits.generation)) return false;
  if (selection.legendary === 'legendary' && !traits.legendary) return false;
  if (selection.legendary === 'not-legendary' && traits.legendary) return false;
  if (selection.mythical === 'mythical' && !traits.mythical) return false;
  if (selection.mythical === 'not-mythical' && traits.mythical) return false;
  return true;
}

export function parsePokemonFilterCatalog(files: {
  species: string;
  pokemon: string;
  types: string;
  pokemonTypes: string;
}): PokemonFilterCatalog {
  const typeNameById = new Map<string, string>();
  for (const row of records(files.types)) {
    const name = cell(row, 'identifier');
    if (!name || EXCLUDED_TYPES.has(name)) continue;
    typeNameById.set(cell(row, 'id'), name);
  }

  const speciesById = new Map<string, { generation: string; legendary: boolean; mythical: boolean }>();
  for (const row of records(files.species)) {
    const generation = POKEMON_FILTER_GENERATIONS[Number(cell(row, 'generation_id')) - 1] ?? '';
    speciesById.set(cell(row, 'id'), {
      generation,
      legendary: cell(row, 'is_legendary') === '1',
      mythical: cell(row, 'is_mythical') === '1',
    });
  }

  const typesByPokemon = new Map<string, { slot: number; name: string }[]>();
  for (const row of records(files.pokemonTypes)) {
    const name = typeNameById.get(cell(row, 'type_id'));
    if (!name) continue;
    const pokemonId = cell(row, 'pokemon_id');
    const slots = typesByPokemon.get(pokemonId) ?? [];
    slots.push({ slot: Number(cell(row, 'slot')), name });
    typesByPokemon.set(pokemonId, slots);
  }

  const byName = new Map<string, PokemonFilterTraits>();
  for (const row of records(files.pokemon)) {
    const species = speciesById.get(cell(row, 'species_id'));
    const name = cell(row, 'identifier');
    if (!species || !name) continue;
    const types = (typesByPokemon.get(cell(row, 'id')) ?? [])
      .sort((a, b) => a.slot - b.slot)
      .map((type) => type.name);
    byName.set(name, {
      types,
      generation: species.generation,
      legendary: species.legendary,
      mythical: species.mythical,
    });
  }

  if (byName.size === 0) throw new Error('Pokémon filter catalog is empty');
  return { byName };
}

function sameStrings(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function records(text: string): CsvRow[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const headers = lines[0]?.split(',') ?? [];
  return lines.slice(1).map((line) => ({ headers, cells: line.split(',') }));
}

type CsvRow = { headers: string[]; cells: string[] };

function cell(row: CsvRow, name: string): string {
  const index = row.headers.indexOf(name);
  if (index < 0) throw new Error(`Pokémon filter catalog is missing ${name}`);
  return row.cells[index]?.trim() ?? '';
}
