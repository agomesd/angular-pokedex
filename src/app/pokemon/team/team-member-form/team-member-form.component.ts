import { Component, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogFooter } from '@spartan-ng/helm/dialog';
import { Select, SelectOption } from '../../select/select.component';
import {
  isTeamRole,
  normalizeNickname,
  TEAM_ROLE_ICON,
  TEAM_ROLES,
  TeamRole,
} from '../team.service';

export type TeamMemberFormValue = {
  nickname: string;
  role: TeamRole | null;
};

@Component({
  selector: 'app-team-member-form',
  templateUrl: './team-member-form.component.html',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmDialogFooter,
    HlmDialogClose,
    Select,
  ],
})
export class TeamMemberForm implements OnInit {
  readonly id = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly nickname = input('');
  readonly role = input<TeamRole | ''>('');
  readonly showRole = input(true);
  readonly error = input<string | null>(null);

  readonly submitted = output<TeamMemberFormValue>();

  protected readonly roleOptions: readonly SelectOption[] = TEAM_ROLES.map(
    (role) => ({
      value: role,
      label: role,
      icon: TEAM_ROLE_ICON[role],
    }),
  );
  protected readonly attempted = signal(false);
  protected readonly form = new FormGroup({
    nickname: new FormControl('', { nonNullable: true }),
    role: new FormControl<TeamRole | ''>('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.form.reset({ nickname: this.nickname(), role: this.role() });
  }

  protected nicknameError(): string | null {
    const nickname = this.form.controls.nickname;
    if (!this.attempted() && !nickname.touched) return null;
    return normalizeNickname(nickname.value)
      ? null
      : 'Nickname must be 3 to 12 characters.';
  }

  protected roleError(): string | null {
    if (!this.showRole()) return null;
    const role = this.form.controls.role;
    if (!this.attempted() && !role.touched) return null;
    return isTeamRole(role.value) ? null : 'Select a role.';
  }

  protected selectRole(role: string): void {
    if (!isTeamRole(role)) return;
    this.form.controls.role.setValue(role);
    this.form.controls.role.markAsTouched();
  }

  protected submit(): void {
    this.attempted.set(true);
    this.form.markAllAsTouched();
    const nickname = normalizeNickname(this.form.controls.nickname.value);
    const role = this.form.controls.role.value;
    if (!nickname) return;
    if (this.showRole() && !isTeamRole(role)) return;
    this.submitted.emit({ nickname, role: isTeamRole(role) ? role : null });
  }
}
