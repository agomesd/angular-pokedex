import { PokemonSpecies } from '../pokemon.service';

export type PokedexEntry = {
  text: string;
  version: string;
};

export function englishGenus(species: PokemonSpecies | null): string | null {
  return species?.genera.find((entry) => entry.language.name === 'en')?.genus ?? null;
}

export function pokedexEntry(species: PokemonSpecies | null, gameId: string | null): PokedexEntry | null {
  if (!species) return null;
  const english = species.flavor_text_entries.filter((entry) => entry.language.name === 'en');
  if (!english.length) return null;

  const matched = gameId ? english.find((entry) => versionMatchesGame(gameId, entry.version.name)) : undefined;
  const entry = matched ?? english[english.length - 1];
  if (!entry) return null;

  return {
    text: entry.flavor_text.replace(/[\f\n\r]+/g, ' ').replace(/\s+/g, ' ').trim(),
    version: entry.version.name,
  };
}

export function genderLabel(rate: number): string {
  if (rate < 0) return 'Genderless';
  const female = (rate / 8) * 100;
  const male = 100 - female;
  return `${trimPercent(male)}% male, ${trimPercent(female)}% female`;
}

export function hatchSteps(counter: number): number {
  return 255 * (counter + 1);
}

function versionMatchesGame(gameId: string, version: string): boolean {
  return gameId === version || gameId.startsWith(`${version}-`) || gameId.endsWith(`-${version}`) || gameId.includes(`-${version}-`);
}

function trimPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
