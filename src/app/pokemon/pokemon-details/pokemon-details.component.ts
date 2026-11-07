import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { PokemonSprite } from '../pokemon-sprite/pokemon-sprite.component';
import { Pokemon, PokemonService, PokemonType } from '../pokemon.service';
import { TEAM_ROLES, TeamRole, TeamService } from '../team/team.service';
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
  protected readonly roles = TEAM_ROLES;
  protected readonly showAddForm = signal(false);
  protected readonly nickname = signal('');
  protected readonly role = signal<TeamRole | ''>('');
  protected readonly addError = signal<string | null>(null);

  protected readonly onTeam = computed(() => this.team.has(this.pokemon().id));
  protected readonly teamFull = computed(() => !this.onTeam() && this.team.members().length >= 6);

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

  protected openAddForm(): void {
    this.addError.set(null);
    this.showAddForm.set(true);
  }

  protected submitAdd(): void {
    const role = this.role();
    const result = this.team.add({
      id: this.pokemon().id,
      name: this.pokemon().name,
      nickname: this.nickname(),
      role: role === '' ? ('' as TeamRole) : role,
      sprite: this.sprite(this.pokemon()),
    });

    if (result.ok) {
      this.showAddForm.set(false);
      this.nickname.set('');
      this.role.set('');
      this.addError.set(null);
      return;
    }

    this.addError.set(addErrorMessage(result.reason));
  }

  constructor() {
    effect(() => {
      this.pokemon().id;
      this.showAddForm.set(false);
      this.nickname.set('');
      this.role.set('');
      this.addError.set(null);
    });

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

function addErrorMessage(reason: 'nickname' | 'role' | 'duplicate' | 'full'): string {
  switch (reason) {
    case 'nickname':
      return 'Nickname must be 3 to 12 characters.';
    case 'role':
      return 'Choose a role.';
    case 'duplicate':
      return 'This Pokémon is already on your team.';
    case 'full':
      return 'Your team already has 6 Pokémon. Remove one before adding another.';
  }
}
