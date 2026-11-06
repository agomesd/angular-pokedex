import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);
  private baseUrl = 'https://pokeapi.co/api/v2';

  getPokemon(name: string) {
    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${name}`);
  }

  getType(typeUrl: string) {
    return this.http.get<PokemonType>(`${typeUrl}`);
  }

  list(limit = 20, offset = 0) {
    return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon`, {
      params: { limit, offset },
    });
  }
}

export type PokemonListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pokemon[];
};

export type Pokemon = {
  name: string;
  types: {
    type: {
      name: string;
      url: string;
    };
  }[];
  sprites: {
    front_default: string | null;
    versions: SpriteVersions;
  };
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

type GameSprites = {
  front_default?: string | null;
};
export type SpriteVersions = Record<string, Record<string, GameSprites>>;
