import { Component, DestroyRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheet, HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { Subject, catchError, map, of, switchMap, tap } from 'rxjs';
import { PokemonDetails } from '../pokemon-details/pokemon-details.component';
import { Pokemon, PokemonService } from '../pokemon.service';
import { normalizeSearch } from '../utils/normalize-search';
import { PokemonListEntry, listEntryForId, listEntryForName } from '../utils/pokemon-directory';
import { PokemonSearchResult, SearchRequest, pokemonSearch } from './pokemon-search';

type SearchSheetState =
  | { status: 'idle' }
  | { status: 'searching'; query: string }
  | { status: 'found'; query: string; pokemon: Pokemon }
  | { status: 'not-found'; query: string }
  | { status: 'network-error'; query: string };

type RangeCheck = {
  query: string;
  force: boolean;
};

@Component({
  selector: 'app-pokemon-search',
  host: { class: 'block min-w-0 flex-1' },
  templateUrl: './pokemon-search.component.html',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    NgIcon,
    HlmSheetImports,
    BrnSheetContent,
    PokemonDetails,
    HlmSpinner,
  ],
  providers: [provideIcons({ lucideSearch })],
})
export class PokemonSearchComponent {
  private readonly pokemonService = inject(PokemonService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requests = new Subject<SearchRequest>();
  private readonly rangeChecks = new Subject<RangeCheck>();
  private readonly sheet = viewChild(HlmSheet);
  private readonly activeQuery = signal<string | null>(null);

  readonly totalPokemon = input<number | null>(null);
  readonly listIndex = output<number>();

  protected readonly sheetState = signal<SearchSheetState>({ status: 'idle' });
  protected readonly rangeError = signal<string | null>(null);

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

  constructor() {
    this.query.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.rangeError.set(null);
    });

    this.rangeChecks
      .pipe(
        switchMap((check) =>
          this.pokemonService.directory(this.totalPokemon()).pipe(
            map((entries) => ({ ...check, entries, failed: false })),
            catchError(() => of({ ...check, entries: [] as PokemonListEntry[], failed: true })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((check) => this.applyRangeCheck(check));
  }

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
    this.activeQuery.set(query);

    if (/^\d+$/.test(query)) {
      this.rangeChecks.next({ query, force });
      return;
    }

    this.rangeError.set(null);
    this.runSearch(force);
  }

  private applyRangeCheck(check: RangeCheck & { entries: PokemonListEntry[]; failed: boolean }): void {
    if (this.activeQuery() !== check.query) return;

    if (check.failed) {
      this.rangeError.set(null);
      this.runSearch(check.force);
      return;
    }

    const entry = listEntryForId(check.entries, Number(check.query));
    if (!entry) {
      this.rejectNumber(check.query);
      return;
    }

    this.rangeError.set(null);
    this.runSearch(check.force);
  }

  private runSearch(force: boolean): void {
    const query = normalizeSearch(this.query.value);
    const current = this.result();

    if (!force && current.status === 'found' && current.query === query) {
      this.sheetState.set(current);
      this.sheet()?.open();
      this.goToListPage(current.pokemon);
      return;
    }

    if (!force && current.status === 'not-found' && current.query === query) {
      if (/^\d+$/.test(query)) {
        this.rejectNumber(query);
        return;
      }
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

    if (result.status === 'not-found' && /^\d+$/.test(result.query)) {
      this.rejectNumber(result.query);
      return;
    }

    this.sheetState.set(result);
    if (result.status === 'found') this.goToListPage(result.pokemon);
  }

  private rejectNumber(query: string): void {
    this.rangeError.set(`No Pokémon has the number ${query}.`);
    this.sheetState.set({ status: 'idle' });
    this.sheet()?.close();
  }

  private goToListPage(pokemon: Pokemon): void {
    const query = this.activeQuery();
    this.pokemonService
      .directory(this.totalPokemon())
      .pipe(
        map((entries) => listEntryForId(entries, pokemon.id) ?? listEntryForName(entries, pokemon.name)),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((entry) => {
        if (this.activeQuery() !== query || !entry) return;
        this.listIndex.emit(entry.index);
      });
  }
}
