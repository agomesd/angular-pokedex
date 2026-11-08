import { isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { PokemonList } from '../pokemon-list/pokemon-list.component';
import { Pokemon } from '../pokemon.service';
import { TeamMember, TeamService } from '../team/team.service';
import { latestFrontDefault } from '../utils/latest-front-default';
import { PokemonCompareCard } from './pokemon-compare-card.component';

@Component({
  selector: 'app-pokemon-compare',
  templateUrl: './pokemon-compare.component.html',
  imports: [RouterLink, HlmButton, PokemonList, PokemonCompareCard],
})
export class PokemonCompare {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly team = inject(TeamService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly hydrated = this.team.hydrated;
  protected readonly teamPokemon = signal<Pokemon | null>(null);
  protected readonly candidatePokemon = signal<Pokemon | null>(null);
  protected readonly notice = signal<string | null>(null);

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((params) => pokemonId(params.get('id')))),
    { initialValue: pokemonId(this.route.snapshot.paramMap.get('id')) },
  );

  protected readonly comparedName = toSignal(
    this.route.queryParamMap.pipe(map((params) => comparedQuery(params.get('with')))),
    { initialValue: comparedQuery(this.route.snapshot.queryParamMap.get('with')) },
  );

  protected readonly member = computed(() => {
    const id = this.routeId();
    if (id == null) return null;
    return this.team.slots().find((slot) => slot?.id === id) ?? null;
  });

  protected readonly canSwap = computed(() => {
    const member = this.member();
    const next = this.candidatePokemon();
    if (!member || !next || next.id === member.id) return false;
    return !this.team.has(next.id);
  });

  protected readonly swapHint = computed(() => {
    const member = this.member();
    const next = this.candidatePokemon();
    if (!member || !next) return null;
    if (next.id === member.id) return 'This Pokémon is already in the slot you are comparing.';
    if (this.team.has(next.id)) return 'This Pokémon is already on your team.';
    return null;
  });

  constructor() {
    effect(() => {
      this.comparedName();
      this.candidatePokemon.set(null);
    });

    effect(() => {
      this.member()?.id;
      this.teamPokemon.set(null);
    });
  }

  protected choose(pokemon: Pokemon): void {
    this.notice.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { with: pokemon.name },
      queryParamsHandling: 'merge',
    });
  }

  protected unselect(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { with: null },
      queryParamsHandling: 'merge',
    });
  }

  protected swap(member: TeamMember): void {
    const next = this.candidatePokemon();
    if (!next || !this.canSwap()) return;

    const result = this.team.replace(member.id, {
      id: next.id,
      name: next.name,
      sprite: latestFrontDefault(next.sprites.versions) ?? next.sprites.front_default,
    });
    if (!result.ok) {
      this.notice.set(
        result.reason === 'duplicate'
          ? 'That Pokémon is already on your team.'
          : 'That Pokémon is no longer on your team.',
      );
      return;
    }

    this.notice.set(`${titleCase(next.name)} replaced ${member.nickname} on your team.`);
    if (!this.isBrowser) return;
    void this.router.navigate(['/compare', next.id], {
      queryParams: { with: null },
      queryParamsHandling: 'merge',
    });
  }
}

function pokemonId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

function comparedQuery(value: string | null): string | null {
  const name = value?.trim();
  return name ? name : null;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
