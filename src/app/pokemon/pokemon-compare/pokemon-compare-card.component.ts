import { TitleCasePipe } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { BrnTooltip, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip';
import { HlmButton } from '@spartan-ng/helm/button';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { PokemonSprite } from '../pokemon-sprite/pokemon-sprite.component';
import { PokemonTypeBadge } from '../pokemon-type-badge/pokemon-type-badge.component';
import { Pokemon, PokemonService, PokemonType } from '../pokemon.service';
import { TeamMember } from '../team/team.service';
import { isPokemonNotFound } from '../utils/is-pokemon-not-found';
import { latestFrontDefault } from '../utils/latest-front-default';
import { latestSymbolIcon } from '../utils/latest-symbol-icon';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

type CompareCardState =
  | { status: 'loading' }
  | { status: 'found'; pokemon: Pokemon; types: PokemonType[] }
  | { status: 'not-found' }
  | { status: 'error' };

type StatComparison = {
  delta: number | null;
  tone: string;
  width: number;
};

@Component({
  selector: 'app-pokemon-compare-card',
  templateUrl: './pokemon-compare-card.component.html',
  imports: [TitleCasePipe, RouterLink, NgIcon, HlmButton, BrnTooltip, PokemonSprite, PokemonTypeBadge],
  providers: [
    provideIcons({ lucideInfo }),
    provideBrnTooltipDefaultOptions({
      tooltipContentClasses:
        'bg-popover text-popover-foreground z-50 w-max max-w-xs rounded-md px-2 py-1.5 text-xs shadow-md ring-1 ring-foreground/10',
      arrowClasses: () => 'hidden',
    }),
  ],
})
export class PokemonCompareCard {
  private readonly pokemonService = inject(PokemonService);
  private readonly attempt = signal(0);

  readonly label = input.required<string>();
  readonly source = input.required<string>();
  readonly member = input<TeamMember | null>(null);
  readonly against = input<Pokemon | null>(null);
  readonly summary = input(false);
  readonly ready = output<Pokemon>();

  protected readonly state = signal<CompareCardState>({ status: 'loading' });

  constructor() {
    effect((onCleanup) => {
      const source = this.source().trim();
      this.attempt();
      this.state.set({ status: 'loading' });
      if (!source) return;

      const request = this.pokemonService
        .getPokemon(source)
        .pipe(
          switchMap((pokemon) => {
            const urls = pokemon.types.map((entry) => entry.type.url);
            const types$ = urls.length
              ? forkJoin(urls.map((url) => this.pokemonService.getType(url))).pipe(
                  catchError(() => of([] as PokemonType[])),
                )
              : of([] as PokemonType[]);
            return types$.pipe(map((types) => ({ pokemon, types })));
          }),
        )
        .subscribe({
          next: ({ pokemon, types }) => {
            this.state.set({ status: 'found', pokemon, types });
            this.ready.emit(pokemon);
          },
          error: (error: unknown) => {
            this.state.set(isPokemonNotFound(error) ? { status: 'not-found' } : { status: 'error' });
          },
        });

      onCleanup(() => request.unsubscribe());
    });
  }

  protected retry(): void {
    this.attempt.update((value) => value + 1);
  }

  protected sprite(pokemon: Pokemon): string | null {
    return latestFrontDefault(pokemon.sprites.versions) ?? pokemon.sprites.front_default;
  }

  protected typeIcon(types: PokemonType[], name: string): string | null {
    const type = types.find((entry) => entry.name === name);
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

  protected comparison(name: string, value: number): StatComparison {
    const other = this.against()?.stats.find((stat) => stat.stat.name === name)?.base_stat;
    const delta = other == null ? null : value - other;
    return {
      delta,
      tone: barTone(delta),
      width: Math.min(100, (value / 255) * 100),
    };
  }

  protected total(pokemon: Pokemon): number {
    return pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
  }

  protected totalDelta(pokemon: Pokemon): number | null {
    const against = this.against();
    if (!against) return null;
    return this.total(pokemon) - this.total(against);
  }
}

function barTone(delta: number | null): string {
  if (delta == null || delta === 0) return 'bg-primary';
  return delta > 0 ? 'bg-emerald-500' : 'bg-rose-500';
}
