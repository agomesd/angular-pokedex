import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideCross, lucideShield, lucideSword } from '@ng-icons/lucide';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { BrnTooltip, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialog, HlmDialogImports } from '@spartan-ng/helm/dialog';
import {
  TEAM_LIMIT,
  TEAM_ROLE_ICON,
  TEAM_ROLES,
  TeamRole,
  TeamService,
  isTeamRole,
  normalizeNickname,
} from '../team.service';

@Component({
  selector: 'app-add-to-team',
  templateUrl: './add-to-team.component.html',
  imports: [TitleCasePipe, ReactiveFormsModule, NgIcon, HlmButton, HlmDialogImports, BrnDialogContent, BrnTooltip],
  providers: [
    provideIcons({ lucideSword, lucideShield, lucideCross, lucideChevronDown }),
    provideBrnTooltipDefaultOptions({
      tooltipContentClasses:
        'bg-popover text-popover-foreground z-50 w-max max-w-40 rounded-md px-2 py-1.5 text-xs shadow-md ring-1 ring-foreground/10',
      arrowClasses: () => 'hidden',
    }),
  ],
})
export class AddToTeam {
  private readonly team = inject(TeamService);
  private readonly dialog = viewChild(HlmDialog);

  readonly pokemonId = input.required<number>();
  readonly name = input.required<string>();
  readonly sprite = input<string | null>(null);
  readonly fullWidth = input(false);
  readonly rounded = input(false);
  readonly appearance = input<'default' | 'outline'>('default');
  readonly explainFull = input(true);
  readonly fullTooltip = input(false);

  protected readonly fullTeamMessage = `Your team already has ${TEAM_LIMIT} Pokémon. Remove one before adding another.`;

  protected readonly roles = TEAM_ROLES;
  protected readonly roleIcons = TEAM_ROLE_ICON;
  protected readonly roleMenuOpen = signal(false);
  protected readonly onTeam = computed(() => this.team.has(this.pokemonId()));
  protected readonly teamFull = computed(() => !this.onTeam() && this.team.members().length >= TEAM_LIMIT);
  protected readonly attempted = signal(false);
  protected readonly addError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    nickname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl<TeamRole | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected nicknameError(): string | null {
    const nickname = this.form.controls.nickname;
    if (!this.attempted() && !nickname.touched) return null;
    return normalizeNickname(nickname.value) ? null : 'Nickname must be 3 to 12 characters.';
  }

  protected roleError(): string | null {
    const role = this.form.controls.role;
    if (!this.attempted() && !role.touched) return null;
    return isTeamRole(role.value) ? null : 'Select a role.';
  }

  protected onDialogState(state: string): void {
    this.roleMenuOpen.set(false);
    if (state !== 'open') return;
    this.attempted.set(false);
    this.addError.set(null);
    this.form.reset({ nickname: '', role: '' });
  }

  protected toggleRoleMenu(): void {
    this.roleMenuOpen.update((open) => !open);
  }

  protected selectRole(role: TeamRole): void {
    this.form.controls.role.setValue(role);
    this.form.controls.role.markAsTouched();
    this.roleMenuOpen.set(false);
  }

  protected onRoleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    const current = event.currentTarget;
    if (next instanceof Node && current instanceof Node && current.contains(next)) return;
    this.roleMenuOpen.set(false);
  }

  protected remove(): void {
    this.team.remove(this.pokemonId());
  }

  protected submit(): void {
    this.attempted.set(true);
    this.form.markAllAsTouched();
    const nickname = normalizeNickname(this.form.controls.nickname.value);
    const role = this.form.controls.role.value;
    if (!nickname || !isTeamRole(role)) return;

    const result = this.team.add({
      id: this.pokemonId(),
      name: this.name(),
      sprite: this.sprite(),
      nickname,
      role,
    });

    if (result.ok) {
      this.dialog()?.close();
      return;
    }

    this.addError.set(
      result.reason === 'full'
        ? `Your team already has ${TEAM_LIMIT} Pokémon. Remove one before adding another.`
        : result.reason === 'duplicate'
          ? 'This Pokémon is already on your team.'
          : 'Check the nickname and role, then try again.',
    );
  }
}
