import { Component, inject } from '@angular/core';
import { PokemonService } from '../pokemon.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { PokemonItem } from '../pokemon-item/pokemon-item.component';

@Component({
  selector: 'app-pokemon-list',
  templateUrl: './pokemon-list.html',
  imports: [HlmCardImports, PokemonItem],
})
export class PokemonList {
  private pokemonService = inject(PokemonService);
  protected list = toSignal(this.pokemonService.list());
}
