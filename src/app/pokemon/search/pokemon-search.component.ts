import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheet, HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { Subject, tap } from 'rxjs';
import { PokemonDetails } from '../pokemon-details/pokemon-details.component';
import { Pokemon, PokemonService } from '../pokemon.service';
import { normalizeSearch } from '../utils/normalize-search';
import { PokemonSearchResult, SearchRequest, pokemonSearch } from './pokemon-search';

type SearchSheetState =
  | { status: 'idle' }
  | { status: 'searching'; query: string }
  | { status: 'found'; query: string; pokemon: Pokemon }
  | { status: 'not-found'; query: string }
  | { status: 'network-error'; query: string };

@Component({
  selector: 'app-pokemon-search',
  templateUrl: './pokemon-search.component.html',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmSheetImports,
    BrnSheetContent,
    PokemonDetails,
    HlmSpinner,
  ],
})
export class PokemonSearchComponent {
  private readonly pokemonService = inject(PokemonService);
  private readonly requests = new Subject<SearchRequest>();
  private readonly sheet = viewChild(HlmSheet);
  private readonly activeQuery = signal<string | null>(null);

  protected readonly sheetState = signal<SearchSheetState>({ status: 'idle' });

  protected readonly query = new FormControl('', { nonNullable: true });
  private readonly queryValue = toSignal(this.query.valueChanges, {
    initialValue: this.query.value,
  });
  protected readonly searchDisabled = computed(
    () => normalizeSearch(this.queryValue()).length === 0,
  );
  protected readonly result = toSignal(
    pokemonSearch(this.requests, (query) => this.pokemonService.getPokemon(query)).pipe(
      tap((result) => this.applyResult(result)),
    ),
    { initialValue: { status: 'idle' } as PokemonSearchResult },
  );

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.searchDisabled()) return;
    this.search(this.result().status === 'network-error');
  }

  protected retry(): void {
    this.search(true);
  }

  private search(force: boolean): void {
    const query = normalizeSearch(this.query.value);
    const current = this.result();
    this.activeQuery.set(query);

    if (!force && current.status === 'found' && current.query === query) {
      this.sheetState.set(current);
      this.sheet()?.open();
      return;
    }

    if (!force && current.status === 'not-found' && current.query === query) {
      this.sheetState.set(current);
      this.sheet()?.open();
      return;
    }

    if (!force && current.status === 'loading' && current.query === query) {
      this.sheetState.set({ status: 'searching', query });
      this.sheet()?.open();
      return;
    }

    this.sheetState.set({ status: 'searching', query });
    this.sheet()?.open();
    this.requests.next({ query: this.query.value, force });
  }

  private applyResult(result: PokemonSearchResult): void {
    if (result.status === 'idle' || result.query !== this.activeQuery()) return;

    if (result.status === 'loading') {
      this.sheetState.set({ status: 'searching', query: result.query });
      return;
    }

    this.sheetState.set(result);
  }
}
