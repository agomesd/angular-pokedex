import { TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { latestFrontDefault } from '../utils/latest-front-default';
import { latestSymbolIcon } from '../utils/latest-symbol-icon';
import { PokemonDetailSheet } from '../pokemon-detail-sheet/pokemon-detail-sheet.component';
import { PokemonTypeBadge } from '../pokemon-type-badge/pokemon-type-badge.component';
import { AddToTeam } from '../team/add-to-team/add-to-team.component';
import { PokemonSprite } from '../pokemon-sprite/pokemon-sprite.component';
import { Pokemon, PokemonService, PokemonType } from '../pokemon.service';

@Component({
  selector: 'app-pokemon-item',
  templateUrl: './pokemon-item.component.html',
  imports: [
    HlmCardImports,
    HlmButton,
    TitleCasePipe,
    PokemonDetailSheet,
    AddToTeam,
    PokemonSprite,
    PokemonTypeBadge,
  ],
})
export class PokemonItem {
  private pokemonService = inject(PokemonService);
  readonly name = input.required<string>();
  readonly action = input<'team' | 'select'>('team');
  readonly selected = output<Pokemon>();

  readonly pokemon = signal<Pokemon | undefined>(undefined);
  readonly pokemonTypes = signal<PokemonType[]>([]);

  protected readonly typeBadges = computed(() =>
    (this.pokemon()?.types ?? []).flatMap((entry) => {
      const icon = this.typeIcon(entry.type.name);
      return icon ? [{ name: entry.type.name, icon }] : [];
    }),
  );

  protected choose(pokemon: Pokemon): void {
    this.selected.emit(pokemon);
  }

  protected pokemonSprite(pokemon: Pokemon): string | null {
    return (
      latestFrontDefault(pokemon.sprites.versions) ??
      pokemon.sprites.front_default
    );
  }

  private typeIcon(name: string): string | null {
    const type = this.pokemonTypes().find((entry) => entry.name === name);
    return type ? latestSymbolIcon(type.sprites) : null;
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
      const pokemon = this.pokemon();
      const urls = pokemon?.types.map((entry) => entry.type.url) ?? [];
      this.pokemonTypes.set([]);
      if (!pokemon || !urls.length) return;
      const subs = forkJoin(
        urls.map((url) => this.pokemonService.getType(url)),
      ).subscribe((types) => {
        this.pokemonTypes.set(types);
      });
      onCleanup(() => subs.unsubscribe());
    });
  }
}
