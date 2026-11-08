import { isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, inject, input, output, PLATFORM_ID, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { PokemonFilters } from '../pokemon-filters/pokemon-filters.component';
import { PokemonItem } from '../pokemon-item/pokemon-item.component';
import { PokemonPagination } from '../pokemon-pagination/pokemon-pagination.component';
import { Pokemon, PokemonService, type PokemonListResponse } from '../pokemon.service';
import { PokemonSearchComponent } from '../search/pokemon-search.component';
import { pokemonIdFromResourceUrl, PokemonListEntry } from '../utils/pokemon-directory';
import { DEFAULT_POKEMON_PAGE_SIZE, listPageQuery, pageForListIndex } from '../utils/list-page';
import {
  EMPTY_POKEMON_FILTERS,
  matchesFilter,
  matchesTeam,
  sameSelection,
  selectionIsActive,
  type PokemonFilterSelection,
} from '../utils/pokemon-filters';
import { browseQuery, browseQueryMatches, filtersFromQuery, hasBrowseQuery } from '../utils/pokemon-list-query';
import { TeamService } from '../team/team.service';
import { PokemonListState } from './pokemon-list-state';

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

type PageList =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: PokemonListResponse };

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
  private readonly listState = inject(PokemonListState);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly browseKey = this.route.snapshot.routeConfig?.path?.startsWith('compare') ? 'compare' : 'pokemon';
  private readonly initialBrowse = this.browseFromRoute();

  readonly itemAction = input<'team' | 'select'>('team');
  readonly layout = input<'page' | 'panel'>('page');
  readonly excludeId = input<number | null>(null);
  readonly pokemonSelected = output<Pokemon>();

  protected readonly page = signal(this.initialBrowse.page);
  protected readonly filters = signal(this.initialBrowse.filters);
  protected readonly gridClass = computed(() =>
    this.layout() === 'panel'
      ? 'grid grid-cols-1 gap-4 p-4 xl:grid-cols-2'
      : 'grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3',
  );
  private readonly filterAttempt = signal(0);
  private readonly listAttempt = signal(0);

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      const page = this.page();
      const filters = this.filters();
      const next = browseQuery(page, filters);
      this.listState.write(this.browseKey, { page, filters });
      if (browseQueryMatches(this.route.snapshot.queryParamMap, next)) return;
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: next,
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
  protected readonly listCount = computed(() => {
    const list = this.list();
    return list.status === 'ready' ? list.data.count : null;
  });
  protected readonly hasNext = computed(() => this.view().hasNext);
  protected readonly lastPage = computed(() => this.view().lastPage);

  protected applyFilters(selection: PokemonFilterSelection): void {
    this.filters.set(selection);
    this.page.set(1);
  }

  protected retry(): void {
    if (this.filtersActive()) {
      this.filterAttempt.update((attempt) => attempt + 1);
      return;
    }
    this.listAttempt.update((attempt) => attempt + 1);
  }

  private browseFromRoute(): { page: number; filters: PokemonFilterSelection } {
    const params = this.route.snapshot.queryParamMap;
    if (hasBrowseQuery(params)) return { page: listPageQuery(params.get('page')), filters: filtersFromQuery(params) };
    // The first navigation is hydrated from the URL. A later visit to a bare
    // /pokemon link restores the browse remembered during this browser session.
    const navigationId = this.router.currentNavigation()?.id ?? this.router.lastSuccessfulNavigation()?.id ?? 1;
    if (navigationId === 1) return { page: 1, filters: EMPTY_POKEMON_FILTERS };
    return this.listState.read(this.browseKey) ?? { page: 1, filters: EMPTY_POKEMON_FILTERS };
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
    attempt: this.listAttempt(),
  }));

  private readonly list = toSignal(
    toObservable(this.query).pipe(
      switchMap(({ limit, offset }) =>
        this.pokemonService.list(limit, offset).pipe(
          map((data) => ({ status: 'ready', data }) satisfies PageList),
          catchError(() => of({ status: 'error' } satisfies PageList)),
          startWith({ status: 'loading' } satisfies PageList),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies PageList },
  );

  private readonly filtered = toSignal(
    toObservable(
      computed(() => ({
        selection: this.filters(),
        attempt: this.filterAttempt(),
        teamIds: this.team.members().map((member) => member.id),
        excludeId: this.excludeId(),
      })),
    ).pipe(
      switchMap(({ selection, teamIds, excludeId }) => {
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
                  entry.id !== excludeId &&
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
    if (!selectionIsActive(selection)) return unfilteredView(this.list(), this.excludeId());

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

function unfilteredView(list: PageList, excludeId: number | null): PokemonListView {
  if (list.status === 'loading') return { status: 'loading', results: [], hasNext: false, lastPage: null, empty: false };
  if (list.status === 'error') return { status: 'error', results: [], hasNext: false, lastPage: null, empty: false };
  const data = list.data;
  const results =
    excludeId == null
      ? data.results
      : data.results.filter((result) => pokemonIdFromResourceUrl(result.url) !== excludeId);
  return {
    status: 'ready',
    results,
    hasNext: data.next != null,
    lastPage: Math.max(1, Math.ceil(data.count / DEFAULT_POKEMON_PAGE_SIZE)),
    empty: false,
  };
}
