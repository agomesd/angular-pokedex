import { TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGitCompareArrows, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialog, HlmDialogImports } from '@spartan-ng/helm/dialog';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { PokemonDetailSheet } from '../../pokemon-detail-sheet/pokemon-detail-sheet.component';
import { PokemonService, PokemonType } from '../../pokemon.service';
import { PokemonSprite } from '../../pokemon-sprite/pokemon-sprite.component';
import { PokemonTypeBadge } from '../../pokemon-type-badge/pokemon-type-badge.component';
import { latestSymbolIcon } from '../../utils/latest-symbol-icon';
import { Select, SelectOption } from '../../select/select.component';
import { TeamMemberForm, TeamMemberFormValue } from '../team-member-form/team-member-form.component';
import { isTeamRole, TEAM_ROLE_ICON, TEAM_ROLES, TeamService, TeamSlot } from '../team.service';

@Component({
  selector: 'li[appTeamSlot]',
  templateUrl: './team-slot.component.html',
  imports: [
    TitleCasePipe,
    RouterLink,
    PokemonSprite,
    NgIcon,
    HlmButton,
    HlmDialogImports,
    BrnDialogContent,
    PokemonDetailSheet,
    PokemonTypeBadge,
    TeamMemberForm,
    Select,
  ],
  providers: [provideIcons({ lucideTrash2, lucideGitCompareArrows, lucidePencil })],
  host: {
    class:
      "relative aspect-square rounded-2xl bg-[url('/pokemon-landscap.jpg')] bg-cover bg-center",
    '[class.z-20]': 'roleMenuOpen()',
    '[class.opacity-60]': 'dragging()',
    '[class.ring-2]': 'dropTarget()',
    '[class.ring-ring]': 'dropTarget()',
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

  private readonly nicknameDialog = viewChild(HlmDialog);
  private readonly roleSelect = viewChild(Select);

  protected readonly roleOptions: readonly SelectOption[] = TEAM_ROLES.map((role) => ({
    value: role,
    label: role,
    icon: TEAM_ROLE_ICON[role],
  }));
  protected readonly roleMenuOpen = signal(false);
  protected readonly nicknameSaveError = signal<string | null>(null);

  protected readonly emptyLabel = computed(() =>
    this.member() ? null : `Empty slot ${this.index() + 1}`,
  );

  protected selectRole(role: string): void {
    const member = this.member();
    if (!member || !isTeamRole(role)) return;
    this.team.setRole(member.id, role);
  }

  protected onNicknameDialog(state: string): void {
    if (state !== 'open') return;
    this.nicknameSaveError.set(null);
  }

  protected saveNickname(value: TeamMemberFormValue): void {
    const member = this.member();
    if (!member) return;

    const result = this.team.setNickname(member.id, value.nickname);
    if (!result.ok) {
      this.nicknameSaveError.set(
        result.reason === 'nickname'
          ? 'Nickname must be 3 to 12 characters.'
          : 'This Pokémon is no longer on your team.',
      );
      return;
    }
    this.nicknameDialog()?.close();
  }

  constructor() {
    effect(() => {
      this.member()?.id;
      this.dragging();
      untracked(() => this.roleSelect()?.closeMenu());
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
