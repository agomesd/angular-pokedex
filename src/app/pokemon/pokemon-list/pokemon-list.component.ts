import { isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, inject, input, output, PLATFORM_ID, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { PokemonFilters } from '../pokemon-filters/pokemon-filters.component';
import { PokemonItem } from '../pokemon-item/pokemon-item.component';
import { PokemonPagination } from '../pokemon-pagination/pokemon-pagination.component';
import { Pokemon, PokemonService, type PokemonListResponse } from '../pokemon.service';
import { PokemonSearchComponent } from '../search/pokemon-search.component';
import { PokemonListEntry } from '../utils/pokemon-directory';
import { DEFAULT_POKEMON_PAGE_SIZE, listPageQuery, pageForListIndex } from '../utils/list-page';
import {
  EMPTY_POKEMON_FILTERS,
  matchesFilter,
  matchesTeam,
  sameSelection,
  selectionIsActive,
  type PokemonFilterSelection,
} from '../utils/pokemon-filters';
import { TeamService } from '../team/team.service';

type FilteredDirectory =
  | { status: 'idle' | 'error' }
  | { status: 'ready'; selection: PokemonFilterSelection; entries: PokemonListEntry[] };

type PokemonListView = {
  status: 'loading' | 'error' | 'ready';
  results: { name: string }[];
  hasNext: boolean;
  lastPage: number | null;
  empty: boolean;
};

@Component({
  selector: 'app-pokemon-list',
  templateUrl: './pokemon-list.html',
  imports: [PokemonItem, PokemonSearchComponent, PokemonPagination, PokemonFilters, HlmButton],
})
export class PokemonList {
  private pokemonService = inject(PokemonService);
  private readonly team = inject(TeamService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly itemAction = input<'team' | 'select'>('team');
  readonly layout = input<'page' | 'panel'>('page');
  readonly pokemonSelected = output<Pokemon>();

  protected readonly page = signal(listPageQuery(this.route.snapshot.queryParamMap.get('page')));
  protected readonly filters = signal(EMPTY_POKEMON_FILTERS);
  protected readonly gridClass = computed(() =>
    this.layout() === 'panel'
      ? 'grid grid-cols-1 gap-4 p-4 xl:grid-cols-2'
      : 'grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3',
  );
  private readonly filterAttempt = signal(0);

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      const page = this.page();
      const current = listPageQuery(this.route.snapshot.queryParamMap.get('page'));
      if (current === page) return;
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: page > 1 ? page : null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    effect(() => {
      const lastPage = this.lastPage();
      if (lastPage == null) return;
      if (this.page() > lastPage) this.page.set(lastPage);
    });
  }

  protected readonly filtersActive = computed(() => selectionIsActive(this.filters()));
  protected readonly listCount = computed(() => this.list()?.count ?? null);
  protected readonly hasNext = computed(() => this.view().hasNext);
  protected readonly lastPage = computed(() => this.view().lastPage);

  protected applyFilters(selection: PokemonFilterSelection): void {
    this.filters.set(selection);
    this.page.set(1);
  }

  protected retryFilters(): void {
    this.filterAttempt.update((attempt) => attempt + 1);
  }

  protected showPokemon(index: number): void {
    if (selectionIsActive(this.filters())) {
      const filtered = this.filtered();
      if (filtered.status === 'ready' && sameSelection(filtered.selection, this.filters())) {
        const position = filtered.entries.findIndex((entry) => entry.index === index);
        if (position >= 0) {
          this.page.set(pageForListIndex(position));
          return;
        }
      }
      this.filters.set(EMPTY_POKEMON_FILTERS);
    }
    this.page.set(pageForListIndex(index));
  }

  private readonly query = computed(() => ({
    limit: DEFAULT_POKEMON_PAGE_SIZE,
    offset: (this.page() - 1) * DEFAULT_POKEMON_PAGE_SIZE,
  }));

  private readonly list = toSignal(
    toObservable(this.query).pipe(
      switchMap(({ limit, offset }) => this.pokemonService.list(limit, offset)),
    ),
  );

  private readonly filtered = toSignal(
    toObservable(
      computed(() => ({
        selection: this.filters(),
        attempt: this.filterAttempt(),
        teamIds: this.team.members().map((member) => member.id),
      })),
    ).pipe(
      switchMap(({ selection, teamIds }) => {
        if (!selectionIsActive(selection)) return of<FilteredDirectory>({ status: 'idle' });
        return combineLatest([
          this.pokemonService.directory().pipe(
            map((entries) => ({ ok: true as const, entries })),
            catchError(() => of({ ok: false as const })),
          ),
          this.pokemonService.filterCatalog().pipe(
            map((catalog) => ({ ok: true as const, catalog })),
            catchError(() => of({ ok: false as const })),
          ),
        ]).pipe(
          map((result): FilteredDirectory => {
            const [directory, catalog] = result;
            if (!directory.ok || !catalog.ok) return { status: 'error' };
            const onTeam = new Set(teamIds);
            return {
              status: 'ready',
              selection,
              entries: directory.entries.filter(
                (entry) =>
                  matchesFilter(catalog.catalog.byName.get(entry.name), selection) &&
                  matchesTeam(onTeam.has(entry.id), selection.team),
              ),
            };
          }),
        );
      }),
    ),
    { initialValue: { status: 'idle' } satisfies FilteredDirectory },
  );

  protected readonly view = computed((): PokemonListView => {
    const selection = this.filters();
    if (!selectionIsActive(selection)) return unfilteredView(this.list());

    const filtered = this.filtered();
    if (filtered.status === 'error') return { status: 'error', results: [], hasNext: false, lastPage: null, empty: false };
    if (filtered.status !== 'ready' || !sameSelection(filtered.selection, selection)) {
      return { status: 'loading', results: [], hasNext: false, lastPage: null, empty: false };
    }

    const start = (this.page() - 1) * DEFAULT_POKEMON_PAGE_SIZE;
    return {
      status: 'ready',
      results: filtered.entries.slice(start, start + DEFAULT_POKEMON_PAGE_SIZE).map((entry) => ({ name: entry.name })),
      hasNext: start + DEFAULT_POKEMON_PAGE_SIZE < filtered.entries.length,
      lastPage: Math.max(1, Math.ceil(filtered.entries.length / DEFAULT_POKEMON_PAGE_SIZE)),
      empty: filtered.entries.length === 0,
    };
  });
}

function unfilteredView(data: PokemonListResponse | undefined): PokemonListView {
  if (!data) return { status: 'loading', results: [], hasNext: false, lastPage: null, empty: false };
  return {
    status: 'ready',
    results: data.results,
    hasNext: data.next != null,
    lastPage: Math.max(1, Math.ceil(data.count / DEFAULT_POKEMON_PAGE_SIZE)),
    empty: false,
  };
}
