import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, switchMap, throwError } from 'rxjs';
import { PokemonListEntry, pokemonListDirectory } from './utils/pokemon-directory';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);
  private baseUrl = 'https://pokeapi.co/api/v2';
  private directory$: Observable<PokemonListEntry[]> | null = null;

  getPokemon(name: string) {
    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${name}`);
  }

  getType(typeUrl: string) {
    return this.http.get<PokemonType>(`${typeUrl}`);
  }

  getSpecies(speciesUrl: string) {
    return this.http.get<PokemonSpecies>(speciesUrl);
  }

  list(limit = 20, offset = 0) {
    return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon`, {
      params: { limit, offset },
    });
  }

  directory(count: number | null = null): Observable<PokemonListEntry[]> {
    this.directory$ ??= this.fetchDirectory(count).pipe(shareReplay(1));
    return this.directory$.pipe(
      catchError((error: unknown) => {
        this.directory$ = null;
        return throwError(() => error);
      }),
    );
  }

  private fetchDirectory(count: number | null): Observable<PokemonListEntry[]> {
    const page = count && count > 0 ? of(count) : this.list(1, 0).pipe(map((response) => response.count));
    return page.pipe(
      switchMap((total) => this.list(total, 0)),
      map((response) => pokemonListDirectory(response.results)),
    );
  }
}

export type PokemonListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: { name: string; url: string }[];
};

export type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  abilities: {
    is_hidden: boolean;
    ability: { name: string; url: string };
  }[];
  stats: {
    base_stat: number;
    effort: number;
    stat: { name: string };
  }[];
  types: {
    slot: number;
    type: { name: string; url: string };
  }[];
  species: { name: string; url: string };
  cries?: { latest?: string | null; legacy?: string | null };
  held_items?: { item: { name: string } }[];
  sprites: PokemonSprites;
};

export type PokemonSprites = {
  front_default: string | null;
  front_shiny?: string | null;
  back_default?: string | null;
  back_shiny?: string | null;
  other?: {
    home?: SpriteFrame;
    'official-artwork'?: SpriteFrame;
  };
  versions: SpriteVersions;
};

export type PokemonSpecies = {
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  hatch_counter: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  growth_rate: { name: string } | null;
  egg_groups: { name: string }[];
  habitat: { name: string } | null;
  generation: { name: string };
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
  genera: { genus: string; language: { name: string } }[];
};

type TypeGameSprites = {
  name_icon?: string | null;
  symbol_icon?: string | null;
};

export type TypeSprites = Record<string, Record<string, TypeGameSprites>>;

export type PokemonType = {
  name: string;
  sprites: TypeSprites;
};

export type SpriteFrame = {
  front_default?: string | null;
  front_shiny?: string | null;
  back_default?: string | null;
  back_shiny?: string | null;
  front_gray?: string | null;
  back_gray?: string | null;
};

export type GameSprites = SpriteFrame & {
  animated?: SpriteFrame | null;
  icons?: SpriteFrame | null;
};

export type SpriteVersions = Record<string, Record<string, GameSprites>>;
