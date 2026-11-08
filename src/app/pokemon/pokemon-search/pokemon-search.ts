import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { Pokemon } from '../pokemon.service';
import { isPokemonNotFound } from '../utils/is-pokemon-not-found';
import { normalizeSearch } from '../utils/normalize-search';

export type SearchRequest = {
  query: string;
  force: boolean;
};

export type PokemonSearchResult =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'found'; query: string; pokemon: Pokemon }
  | { status: 'not-found'; query: string }
  | { status: 'network-error'; query: string };

export function pokemonSearch(
  requests: Observable<SearchRequest>,
  lookup: (query: string) => Observable<Pokemon>,
): Observable<PokemonSearchResult> {
  return requests.pipe(
    map((request) => ({
      query: normalizeSearch(request.query),
      force: request.force,
    })),
    debounceTime(300),
    distinctUntilChanged(
      (previous, current) => previous.query === current.query && !current.force,
    ),
    switchMap((request) => lookupPokemon(request.query, lookup)),
  );
}

function lookupPokemon(
  query: string,
  lookup: (query: string) => Observable<Pokemon>,
): Observable<PokemonSearchResult> {
  if (!query) {
    return of({ status: 'idle' });
  }

  return lookup(query).pipe(
    map((pokemon) => ({ status: 'found' as const, query, pokemon })),
    catchError((error: unknown) =>
      of(
        isPokemonNotFound(error)
          ? { status: 'not-found' as const, query }
          : { status: 'network-error' as const, query },
      ),
    ),
    startWith({ status: 'loading' as const, query }),
  );
}
