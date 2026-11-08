import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { BrnTooltip, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialog, HlmDialogImports } from '@spartan-ng/helm/dialog';
import { TeamMemberForm, TeamMemberFormValue } from '../team-member-form/team-member-form.component';
import { TEAM_LIMIT, TeamService, isTeamRole } from '../team.service';

@Component({
  selector: 'app-add-to-team',
  templateUrl: './add-to-team.component.html',
  imports: [TitleCasePipe, HlmButton, HlmDialogImports, BrnDialogContent, BrnTooltip, TeamMemberForm],
  providers: [
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

  protected readonly onTeam = computed(() => this.team.has(this.pokemonId()));
  protected readonly teamFull = computed(() => !this.onTeam() && this.team.members().length >= TEAM_LIMIT);
  protected readonly addError = signal<string | null>(null);

  protected onDialogState(state: string): void {
    if (state !== 'open') return;
    this.addError.set(null);
  }

  protected remove(): void {
    this.team.remove(this.pokemonId());
  }

  protected submit(value: TeamMemberFormValue): void {
    if (!isTeamRole(value.role)) return;

    const result = this.team.add({
      id: this.pokemonId(),
      name: this.name(),
      sprite: this.sprite(),
      nickname: value.nickname,
      role: value.role,
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
