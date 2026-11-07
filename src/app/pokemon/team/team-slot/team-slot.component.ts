import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { PokemonDetailSheet } from '../../pokemon-detail-sheet/pokemon-detail-sheet.component';
import { PokemonService, PokemonType } from '../../pokemon.service';
import { PokemonSprite } from '../../pokemon-sprite/pokemon-sprite.component';
import { latestSymbolIcon } from '../../utils/latest-symbol-icon';
import { TeamSlot } from '../team.service';

@Component({
  selector: 'li[appTeamSlot]',
  templateUrl: './team-slot.component.html',
  imports: [TitleCasePipe, NgOptimizedImage, RouterLink, PokemonSprite, NgIcon, HlmButton, PokemonDetailSheet],
  providers: [provideIcons({ lucideTrash2 })],
  host: {
    class:
      "relative aspect-square rounded-2xl bg-[url('/pokemon-landscap.jpg')] bg-cover bg-center",
    '[class.opacity-60]': 'dragging()',
    '[class.ring-2]': 'dropTarget()',
    '[class.ring-indigo-600]': 'dropTarget()',
    '[attr.data-team-slot]': 'index()',
    '[attr.aria-label]': 'emptyLabel()',
  },
})
export class TeamSlotComponent {
  private readonly pokemonService = inject(PokemonService);

  readonly index = input.required<number>();
  readonly member = input.required<TeamSlot>();
  readonly dragging = input(false);
  readonly dropTarget = input(false);

  private readonly loadedTypes = signal<PokemonType[]>([]);
  protected readonly typeIcons = computed(() =>
    this.loadedTypes().flatMap((type) => {
      const icon = latestSymbolIcon(type.sprites);
      return icon ? [{ name: type.name, icon }] : [];
    }),
  );

  readonly remove = output<number>();
  readonly dragStarted = output<DragEvent>();
  readonly dragEnded = output<void>();
  readonly pointerPressed = output<PointerEvent>();
  readonly pointerMoved = output<PointerEvent>();
  readonly pointerReleased = output<PointerEvent>();
  readonly pointerCancelled = output<PointerEvent>();
  readonly reorderKey = output<KeyboardEvent>();

  protected readonly emptyLabel = computed(() =>
    this.member() ? null : `Empty slot ${this.index() + 1}`,
  );

  constructor() {
    effect((onCleanup) => {
      const member = this.member();
      this.loadedTypes.set([]);
      if (!member) return;

      const request = this.pokemonService
        .getPokemon(String(member.id))
        .pipe(
          switchMap((pokemon) => {
            const urls = pokemon.types.map((entry) => entry.type.url);
            return urls.length
              ? forkJoin(urls.map((url) => this.pokemonService.getType(url)))
              : of([]);
          }),
          catchError(() => of([] as PokemonType[])),
        )
        .subscribe((types) => this.loadedTypes.set(types));

      onCleanup(() => request.unsubscribe());
    });
  }
}
