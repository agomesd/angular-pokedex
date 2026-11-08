import { Injectable } from '@angular/core';
import { type PokemonFilterSelection } from '../utils/pokemon-filters';
import { sanitizeFilters, sanitizePage } from '../utils/pokemon-list-query';

export type PokemonListBrowse = {
  page: number;
  filters: PokemonFilterSelection;
};

const STORAGE_KEY = 'pokemon-list-browse';

@Injectable({ providedIn: 'root' })
export class PokemonListState {
  private readonly memory = new Map<string, PokemonListBrowse>();

  read(key: string): PokemonListBrowse | null {
    const cached = this.memory.get(key);
    if (cached) return cloneBrowse(cached);
    const stored = readStorage()[key];
    if (!stored) return null;
    const browse = cloneBrowse(stored);
    this.memory.set(key, browse);
    return cloneBrowse(browse);
  }

  write(key: string, browse: PokemonListBrowse): void {
    const copy = cloneBrowse(browse);
    this.memory.set(key, copy);
    const stored = readStorage();
    stored[key] = copy;
    writeStorage(stored);
  }
}

function cloneBrowse(browse: PokemonListBrowse): PokemonListBrowse {
  return {
    page: browse.page,
    filters: {
      ...browse.filters,
      types: [...browse.filters.types],
      generations: [...browse.filters.generations],
    },
  };
}

function readStorage(): Record<string, PokemonListBrowse> {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const result: Record<string, PokemonListBrowse> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue;
      const raw = value as { page?: unknown; filters?: unknown };
      result[key] = { page: sanitizePage(raw.page), filters: sanitizeFilters(raw.filters) };
    }
    return result;
  } catch {
    return {};
  }
}

function writeStorage(stored: Record<string, PokemonListBrowse>): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}
