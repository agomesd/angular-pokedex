import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { PokemonSprite } from '../pokemon-sprite/pokemon-sprite.component';
import { Pokemon, PokemonService, PokemonType } from '../pokemon.service';
import { TEAM_LIMIT, TeamService } from '../team/team.service';
import { latestFrontDefault } from '../utils/latest-front-default';
import { latestSymbolIcon } from '../utils/latest-symbol-icon';
import { typeColour } from '../utils/type-colour';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

@Component({
  selector: 'app-pokemon-details',
  templateUrl: './pokemon-details.component.html',
  imports: [HlmSheetImports, TitleCasePipe, NgOptimizedImage, PokemonSprite, RouterLink, HlmButton],
})
export class PokemonDetails {
  private readonly pokemonService = inject(PokemonService);
  private readonly team = inject(TeamService);

  readonly pokemon = input.required<Pokemon>();
  readonly types = input<PokemonType[]>();

  private readonly loadedTypes = signal<PokemonType[]>([]);

  protected readonly teamLimit = TEAM_LIMIT;
  protected readonly onTeam = computed(() => this.team.has(this.pokemon().id));
  protected readonly teamFull = computed(() => !this.onTeam() && this.team.members().length >= TEAM_LIMIT);

  protected readonly typeColour = typeColour;

  protected displayTypes(): PokemonType[] {
    return this.types() ?? this.loadedTypes();
  }

  protected sprite(pokemon: Pokemon): string | null {
    return latestFrontDefault(pokemon.sprites.versions) ?? pokemon.sprites.front_default;
  }

  protected typeIcon(name: string): string | null {
    const type = this.displayTypes().find((entry) => entry.name === name);
    return type ? latestSymbolIcon(type.sprites) : null;
  }

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

  protected toggleTeam(): void {
    const pokemon = this.pokemon();
    if (this.team.has(pokemon.id)) {
      this.team.remove(pokemon.id);
      return;
    }

    this.team.add({
      id: pokemon.id,
      name: pokemon.name,
      sprite: this.sprite(pokemon),
    });
  }

  constructor() {
    effect((onCleanup) => {
      if (this.types() !== undefined) return;

      const urls = this.pokemon().types.map((entry) => entry.type.url);
      this.loadedTypes.set([]);
      if (!urls.length) return;

      const subs = forkJoin(urls.map((url) => this.pokemonService.getType(url))).subscribe(
        (types) => this.loadedTypes.set(types),
      );
      onCleanup(() => subs.unsubscribe());
    });
  }
}
