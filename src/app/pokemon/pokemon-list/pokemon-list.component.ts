import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HlmNumberedPagination } from '@spartan-ng/helm/pagination';
import { switchMap } from 'rxjs';
import { PokemonItem } from '../pokemon-item/pokemon-item.component';
import { PokemonService } from '../pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  templateUrl: './pokemon-list.html',
  imports: [PokemonItem, HlmNumberedPagination],
})
export class PokemonList {
  private pokemonService = inject(PokemonService);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);

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
