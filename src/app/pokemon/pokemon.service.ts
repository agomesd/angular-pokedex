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
    versions: {
      'generation-viii': {
        'sword-shield': {
          front_default: string | null;
        };
      };
    };
  };
};

export type PokemonType = {
  name: string;
  sprites: {
    'generation-viii': {
      'brilliant-diamond-shining-pearl': {
        symbol_icon: string | null;
      };
    };
  };
};
