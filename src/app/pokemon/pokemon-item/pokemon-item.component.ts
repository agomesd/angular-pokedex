import { Component, inject, input, effect, signal } from '@angular/core';
import { TitleCasePipe, NgOptimizedImage } from '@angular/common';
import { forkJoin } from 'rxjs';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { latestFrontDefault } from '../utils/latest-front-default';
import { latestSymbolIcon } from '../utils/latest-symbol-icon';
import { typeColour } from '../utils/type-colour';
import { Pokemon, PokemonService, PokemonType } from '../pokemon.service';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

@Component({
  selector: 'app-pokemon-item',
  templateUrl: './pokemon-item.component.html',
  imports: [
    HlmCardImports,
    HlmButton,
    HlmSheetImports,
    BrnSheetContent,
    TitleCasePipe,
    NgOptimizedImage,
  ],
})
export class PokemonItem {
  private pokemonService = inject(PokemonService);
  readonly name = input.required<string>();

  readonly pokemon = signal<Pokemon | undefined>(undefined);
  readonly pokemonTypes = signal<PokemonType[]>([]);

  protected pokemonSprite(pokemon: Pokemon): string | null {
    return (
      latestFrontDefault(pokemon.sprites.versions) ??
      pokemon.sprites.front_default
    );
  }

  protected typeIcon(name: string): string | null {
    const type = this.pokemonTypes().find((entry) => entry.name === name);
    return type ? latestSymbolIcon(type.sprites) : null;
  }

  protected readonly typeColour = typeColour;

  protected heightInMetres(decimetres: number): string {
    return `${(decimetres / 10).toFixed(1)} m`;
  }

  protected weightInKilograms(hectograms: number): string {
    return `${(hectograms / 10).toFixed(1)} kg`;
  }

  protected statLabel(name: string): string {
    return STAT_LABELS[name] ?? name;
  }

  protected statWidth(value: number): number {
    return Math.min(100, (value / 255) * 100);
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
      const urls = this.pokemon()?.types.map((entry) => entry.type.url) ?? [];
      this.pokemonTypes.set([]);
      if (!urls.length) return;
      const subs = forkJoin(
        urls.map((url) => this.pokemonService.getType(url)),
      ).subscribe((types) => {
        this.pokemonTypes.set(types);
      });
      onCleanup(() => subs.unsubscribe());
    });
  }
}
