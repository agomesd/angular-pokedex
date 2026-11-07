import { TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCross, lucideShield, lucideSword, lucideTrash2 } from '@ng-icons/lucide';
import { BrnTooltip, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip';
import { HlmButton } from '@spartan-ng/helm/button';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { PokemonDetailSheet } from '../../pokemon-detail-sheet/pokemon-detail-sheet.component';
import { PokemonService, PokemonType } from '../../pokemon.service';
import { PokemonSprite } from '../../pokemon-sprite/pokemon-sprite.component';
import { PokemonTypeBadge } from '../../pokemon-type-badge/pokemon-type-badge.component';
import { latestSymbolIcon } from '../../utils/latest-symbol-icon';
import { TEAM_ROLE_ICON, TEAM_ROLES, TeamRole, TeamService, TeamSlot } from '../team.service';

@Component({
  selector: 'li[appTeamSlot]',
  templateUrl: './team-slot.component.html',
  imports: [TitleCasePipe, RouterLink, PokemonSprite, NgIcon, HlmButton, PokemonDetailSheet, BrnTooltip, PokemonTypeBadge],
  providers: [
    provideIcons({ lucideTrash2, lucideSword, lucideShield, lucideCross }),
    provideBrnTooltipDefaultOptions({
      tooltipContentClasses:
        'bg-popover text-popover-foreground z-50 w-max max-w-40 rounded-md px-2 py-1.5 text-xs shadow-md ring-1 ring-foreground/10',
      arrowClasses: () => 'hidden',
    }),
  ],
  host: {
    class:
      "relative aspect-square rounded-2xl bg-[url('/pokemon-landscap.jpg')] bg-cover bg-center",
    '[class.z-20]': 'roleMenuOpen()',
    '[class.opacity-60]': 'dragging()',
    '[class.ring-2]': 'dropTarget()',
    '[class.ring-indigo-600]': 'dropTarget()',
    '[attr.data-team-slot]': 'index()',
    '[attr.aria-label]': 'emptyLabel()',
  },
})
export class TeamSlotComponent {
  private readonly pokemonService = inject(PokemonService);
  private readonly team = inject(TeamService);

  readonly index = input.required<number>();
  readonly member = input.required<TeamSlot>();
  readonly dragging = input(false);
  readonly dropTarget = input(false);

  private readonly memberId = computed(() => this.member()?.id ?? null);
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

  protected readonly roles = TEAM_ROLES;
  protected readonly roleIcons = TEAM_ROLE_ICON;
  protected readonly roleMenuOpen = signal(false);
  protected readonly tooltipSuppressed = signal(false);

  protected readonly emptyLabel = computed(() =>
    this.member() ? null : `Empty slot ${this.index() + 1}`,
  );

  protected suppressTooltip(event: Event): void {
    const button = event.currentTarget;
    if (button instanceof HTMLElement) {
      button.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true, pointerType: 'mouse' }));
    }
    this.tooltipSuppressed.set(true);
  }

  protected toggleRoleMenu(): void {
    this.roleMenuOpen.update((open) => !open);
  }

  protected selectRole(role: TeamRole): void {
    const member = this.member();
    if (member) this.team.setRole(member.id, role);
    this.roleMenuOpen.set(false);
  }

  protected onRoleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    const current = event.currentTarget;
    if (next instanceof Node && current instanceof Node && current.contains(next)) return;
    this.roleMenuOpen.set(false);
  }

  constructor() {
    effect(() => {
      this.member()?.id;
      this.dragging();
      this.roleMenuOpen.set(false);
    });

    effect((onCleanup) => {
      const id = this.memberId();
      this.loadedTypes.set([]);
      if (id == null) return;

      const request = this.pokemonService
        .getPokemon(String(id))
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
