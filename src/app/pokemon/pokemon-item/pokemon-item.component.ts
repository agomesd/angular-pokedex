import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { latestFrontDefault } from '../utils/latest-front-default';
import { latestSymbolIcon } from '../utils/latest-symbol-icon';
import { typeColour } from '../utils/type-colour';
import { PokemonDetailSheet } from '../pokemon-detail-sheet/pokemon-detail-sheet.component';
import { PokemonSprite } from '../pokemon-sprite/pokemon-sprite.component';
import { Pokemon, PokemonService, PokemonType } from '../pokemon.service';

@Component({
  selector: 'app-pokemon-item',
  templateUrl: './pokemon-item.component.html',
  imports: [
    HlmCardImports,
    TitleCasePipe,
    NgOptimizedImage,
    PokemonDetailSheet,
    PokemonSprite,
    HlmSpinner,
  ],
})
export class PokemonItem {
  private pokemonService = inject(PokemonService);
  private readonly typeIconImage = viewChild<ElementRef<HTMLImageElement>>('typeIcon');
  readonly name = input.required<string>();

  readonly pokemon = signal<Pokemon | undefined>(undefined);
  readonly pokemonTypes = signal<PokemonType[]>([]);
  private readonly typesReady = signal(false);
  private readonly loadedTypeIcon = signal<string | null>(null);
  private readonly failedTypeIcon = signal<string | null>(null);

  protected readonly primaryTypeName = computed(() => this.pokemon()?.types[0]?.type.name ?? null);

  protected readonly primaryTypeIcon = computed(() => {
    const name = this.primaryTypeName();
    return name ? this.typeIcon(name) : null;
  });

  protected readonly showTypeSpinner = computed(() => {
    const icon = this.primaryTypeIcon();
    if (!icon) return !this.typesReady();
    if (this.failedTypeIcon() === icon) return false;
    return this.loadedTypeIcon() !== icon;
  });

  protected pokemonSprite(pokemon: Pokemon): string | null {
    return (
      latestFrontDefault(pokemon.sprites.versions) ??
      pokemon.sprites.front_default
    );
  }

  protected onTypeIconLoad(icon: string): void {
    this.loadedTypeIcon.set(icon);
  }

  protected onTypeIconError(icon: string): void {
    this.failedTypeIcon.set(icon);
  }

  protected typeIconReady(icon: string): boolean {
    return this.loadedTypeIcon() === icon;
  }

  protected typeIcon(name: string): string | null {
    const type = this.pokemonTypes().find((entry) => entry.name === name);
    return type ? latestSymbolIcon(type.sprites) : null;
  }

  protected readonly typeColour = typeColour;

  constructor() {
    effect(() => {
      const icon = this.primaryTypeIcon();
      const image = this.typeIconImage()?.nativeElement;
      if (icon && image?.complete && image.naturalWidth > 0) {
        this.loadedTypeIcon.set(icon);
      }
    });

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
      this.loadedTypeIcon.set(null);
      this.failedTypeIcon.set(null);
      if (!pokemon) {
        this.typesReady.set(false);
        return;
      }
      if (!urls.length) {
        this.typesReady.set(true);
        return;
      }
      this.typesReady.set(false);
      const subs = forkJoin(
        urls.map((url) => this.pokemonService.getType(url)),
      ).subscribe((types) => {
        this.pokemonTypes.set(types);
        this.typesReady.set(true);
      });
      onCleanup(() => subs.unsubscribe());
    });
  }
}
