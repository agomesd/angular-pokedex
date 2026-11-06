import { Component, inject, input, effect, signal } from '@angular/core';
import { TitleCasePipe, NgOptimizedImage } from '@angular/common';
import { latestFrontDefault } from '../utils/latest-front-default';
import { Pokemon, PokemonService, PokemonType } from '../pokemon.service';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-pokemon-item',
  templateUrl: './pokemon-item.component.html',
  imports: [HlmCardImports, TitleCasePipe, NgOptimizedImage],
})
export class PokemonItem {
  private pokemonService = inject(PokemonService);
  readonly name = input.required<string>();

  readonly pokemon = signal<Pokemon | undefined>(undefined);
  readonly pokemonType = signal<PokemonType | undefined>(undefined);

  protected pokemonSprite(pokemon: Pokemon): string | null {
    return (
      latestFrontDefault(pokemon.sprites.versions) ??
      pokemon.sprites.front_default
    );
  }

  constructor() {
    effect((onCleanup) => {
      const subs = this.pokemonService
        .getPokemon(this.name())
        .subscribe((pokemon) => {
          this.pokemon.set(pokemon);
        });
      onCleanup(() => subs.unsubscribe());
    });

    effect((onCleanup) => {
      const url = this.pokemon()?.types[0]?.type.url;
      if (!url) return;
      const subs = this.pokemonService.getType(url).subscribe((type) => {
        this.pokemonType.set(type);
      });
      onCleanup(() => subs.unsubscribe());
    });
  }
}
