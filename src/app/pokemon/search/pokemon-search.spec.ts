import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Pokemon } from '../pokemon.service';
import { normalizeSearch } from '../utils/normalize-search';
import { PokemonSearchResult, SearchRequest, pokemonSearch } from './pokemon-search';

describe('normalizeSearch', () => {
  it('trims whitespace and lowercases names', () => {
    expect(normalizeSearch('  PiKaChU  ')).toBe('pikachu');
  });

  it('treats numeric ids with leading zeros as the same id', () => {
    expect(normalizeSearch(' 025 ')).toBe('25');
    expect(normalizeSearch('0')).toBe('0');
  });
});

describe('pokemonSearch', () => {
  let requests: Subject<SearchRequest>;

  beforeEach(() => {
    requests = new Subject<SearchRequest>();
  });

  it('looks up the trimmed, lowercase name after 300ms', fakeAsync(() => {
    const lookups: string[] = [];
    const results = collect((query) => {
      lookups.push(query);
      return of(pokemon(25, 'pikachu'));
    });

    requests.next({ query: '  PiKaChU ', force: false });
    tick(299);
    expect(lookups).toEqual([]);

    tick(1);
    expect(lookups).toEqual(['pikachu']);
    expect(results.at(-1)).toEqual({
      status: 'found',
      query: 'pikachu',
      pokemon: pokemon(25, 'pikachu'),
    });
  }));

  it('does not call the API for an empty submission', fakeAsync(() => {
    const lookups: string[] = [];
    const results = collect((query) => {
      lookups.push(query);
      return of(pokemon(1, 'bulbasaur'));
    });

    requests.next({ query: '   ', force: false });
    tick(300);

    expect(lookups).toEqual([]);
    expect(results.at(-1)).toEqual({ status: 'idle' });
  }));

  it('skips a repeated search and still retries when forced', fakeAsync(() => {
    const lookups: string[] = [];
    collect((query) => {
      lookups.push(query);
      return of(pokemon(132, 'ditto'));
    });

    requests.next({ query: 'Ditto', force: false });
    tick(300);
    requests.next({ query: ' ditto ', force: false });
    tick(300);
    requests.next({ query: 'ditto', force: true });
    tick(300);

    expect(lookups).toEqual(['ditto', 'ditto']);
  }));

  it('cancels an in-flight lookup when the submission changes', fakeAsync(() => {
    let unsubscribed = 0;
    const lookups: string[] = [];
    const results = collect((query) => {
      lookups.push(query);
      return new Observable<Pokemon>(() => () => {
        unsubscribed += 1;
      });
    });

    requests.next({ query: 'ditto', force: false });
    tick(300);
    requests.next({ query: '   ', force: false });
    tick(300);

    expect(lookups).toEqual(['ditto']);
    expect(unsubscribed).toBe(1);
    expect(results.at(-1)).toEqual({ status: 'idle' });
  }));

  it('keeps only the latest submission inside the debounce window', fakeAsync(() => {
    const lookups: string[] = [];
    collect((query) => {
      lookups.push(query);
      return of(pokemon(25, query));
    });

    requests.next({ query: 'ditto', force: false });
    tick(200);
    requests.next({ query: 'pikachu', force: false });
    tick(299);
    expect(lookups).toEqual([]);

    tick(1);
    expect(lookups).toEqual(['pikachu']);
  }));

  it('reports a missing Pokémon when the API returns 404', fakeAsync(() => {
    const results = collect(() =>
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );

    requests.next({ query: 'missingno', force: false });
    tick(300);

    expect(results.at(-1)).toEqual({ status: 'not-found', query: 'missingno' });
  }));

  it('reports a network failure separately from a missing Pokémon', fakeAsync(() => {
    const results = collect(() =>
      throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' })),
    );

    requests.next({ query: 'ditto', force: false });
    tick(300);

    expect(results).toContain({ status: 'loading', query: 'ditto' });
    expect(results.at(-1)).toEqual({ status: 'network-error', query: 'ditto' });
  }));

  function collect(
    lookup: (query: string) => Observable<Pokemon>,
  ): PokemonSearchResult[] {
    const results: PokemonSearchResult[] = [];
    pokemonSearch(requests, lookup).subscribe((result) => results.push(result));
    return results;
  }
});

function pokemon(id: number, name: string): Pokemon {
  return { id, name } as Pokemon;
}
