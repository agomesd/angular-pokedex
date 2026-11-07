import { isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmNumberedPagination } from '@spartan-ng/helm/pagination';
import { switchMap } from 'rxjs';
import { PokemonItem } from '../pokemon-item/pokemon-item.component';
import { PokemonService } from '../pokemon.service';
import { PokemonSearchComponent } from '../search/pokemon-search.component';
import { DEFAULT_POKEMON_PAGE_SIZE, listPageQuery, pageForListIndex } from '../utils/list-page';

@Component({
  selector: 'app-pokemon-list',
  templateUrl: './pokemon-list.html',
  imports: [PokemonItem, HlmNumberedPagination, PokemonSearchComponent],
})
export class PokemonList {
  private pokemonService = inject(PokemonService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly page = signal(listPageQuery(this.route.snapshot.queryParamMap.get('page')));
  protected readonly pageSize = signal(DEFAULT_POKEMON_PAGE_SIZE);

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
  }

  protected showPokemon(index: number): void {
    this.page.set(pageForListIndex(index, this.pageSize()));
  }

  private readonly query = computed(() => ({
    limit: this.pageSize(),
    offset: (this.page() - 1) * this.pageSize(),
  }));

  protected readonly list = toSignal(
    toObservable(this.query).pipe(
      switchMap(({ limit, offset }) => this.pokemonService.list(limit, offset)),
    ),
  );
}
