import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, output, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFunnel } from '@ng-icons/lucide';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { BrnSwitch, BrnSwitchThumb } from '@spartan-ng/brain/switch';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheet, HlmSheetImports } from '@spartan-ng/helm/sheet';
import { catchError, forkJoin, map, of } from 'rxjs';
import { PokemonService } from '../pokemon.service';
import { generationLabel, generationNumeral } from '../utils/generation-order';
import { latestSymbolIcon } from '../utils/latest-symbol-icon';
import {
  EMPTY_POKEMON_FILTERS,
  POKEMON_FILTER_GENERATIONS,
  POKEMON_FILTER_TYPES,
  sameSelection,
  selectionIsActive,
  type LegendaryFilter,
  type MythicalFilter,
  type PokemonFilterSelection,
  type TeamFilter,
} from '../utils/pokemon-filters';
import { typeCheckedTrack } from '../utils/type-colour';
import { Select } from '../../components/select/select.component';

@Component({
  selector: 'app-pokemon-filters',
  templateUrl: './pokemon-filters.component.html',
  imports: [
    TitleCasePipe,
    NgIcon,
    HlmButton,
    HlmSheetImports,
    Select,
    BrnSheetContent,
    BrnSwitch,
    BrnSwitchThumb,
  ],
  providers: [provideIcons({ lucideFunnel })],
})
export class PokemonFilters {
  private readonly pokemonService = inject(PokemonService);
  private readonly sheet = viewChild(HlmSheet);

  readonly selection = input<PokemonFilterSelection>(EMPTY_POKEMON_FILTERS);
  readonly filtersChange = output<PokemonFilterSelection>();

  protected readonly typeOptions = POKEMON_FILTER_TYPES;
  protected readonly generationOptions = POKEMON_FILTER_GENERATIONS;
  protected readonly legendaryOptions: { value: LegendaryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'legendary', label: 'Legendary' },
    { value: 'not-legendary', label: 'Non-legendary' },
  ];
  protected readonly mythicalOptions: { value: MythicalFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'mythical', label: 'Mythical' },
    { value: 'not-mythical', label: 'Non-mythical' },
  ];
  protected readonly teamOptions: { value: TeamFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'on-team', label: 'On team' },
    { value: 'not-on-team', label: 'Not on team' },
  ];
  protected readonly filtersActive = computed(() => selectionIsActive(this.selection()));
  protected readonly hasTypes = computed(() => this.selection().types.length > 0);
  protected readonly hasGenerations = computed(() => this.selection().generations.length > 0);
  protected readonly generationName = generationLabel;
  protected readonly generationNumeral = generationNumeral;
  protected readonly typeCheckedTrack = typeCheckedTrack;
  protected readonly typeIcons = toSignal(
    forkJoin(
      POKEMON_FILTER_TYPES.map((type) =>
        this.pokemonService.getTypeByName(type).pipe(
          map((result) => [type, latestSymbolIcon(result.sprites)] as const),
          catchError(() => of([type, null] as const)),
        ),
      ),
    ).pipe(map((entries) => Object.fromEntries(entries))),
    { initialValue: {} as Record<string, string | null> },
  );

  protected open(): void {
    this.sheet()?.open();
  }

  protected typeSelected(type: string): boolean {
    return this.selection().types.includes(type);
  }

  protected generationSelected(generation: string): boolean {
    return this.selection().generations.includes(generation);
  }

  protected setType(type: string, checked: boolean): void {
    const current = this.selection().types;
    if (checked === current.includes(type)) return;
    const types = checked ? [...current, type] : current.filter((item) => item !== type);
    this.update({ types });
  }

  protected setGeneration(generation: string, checked: boolean): void {
    const current = this.selection().generations;
    if (checked === current.includes(generation)) return;
    const generations = checked ? [...current, generation] : current.filter((item) => item !== generation);
    this.update({ generations });
  }

  protected setLegendary(value: string): void {
    if (!isLegendaryFilter(value)) return;
    this.update({ legendary: value });
  }

  protected setMythical(value: string): void {
    if (!isMythicalFilter(value)) return;
    this.update({ mythical: value });
  }

  protected setTeam(value: string): void {
    if (!isTeamFilter(value)) return;
    this.update({ team: value });
  }

  protected clearTypes(): void {
    this.update({ types: [] });
  }

  protected clearGenerations(): void {
    this.update({ generations: [] });
  }

  protected clearAll(): void {
    this.update(EMPTY_POKEMON_FILTERS);
  }

  private update(patch: Partial<PokemonFilterSelection>): void {
    const next = { ...this.selection(), ...patch };
    if (sameSelection(next, this.selection())) return;
    this.filtersChange.emit(next);
  }
}

function isLegendaryFilter(value: string): value is LegendaryFilter {
  return value === 'all' || value === 'legendary' || value === 'not-legendary';
}

function isMythicalFilter(value: string): value is MythicalFilter {
  return value === 'all' || value === 'mythical' || value === 'not-mythical';
}

function isTeamFilter(value: string): value is TeamFilter {
  return value === 'all' || value === 'on-team' || value === 'not-on-team';
}
