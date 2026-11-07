import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export const TEAM_ROLES = ['Attacker', 'Defender', 'Support'] as const;
export const TEAM_LIMIT = 6;

export type TeamRole = (typeof TEAM_ROLES)[number];

export type TeamMember = {
  id: number;
  name: string;
  nickname: string;
  role: TeamRole;
  sprite: string | null;
};

export type TeamAddResult =
  | { ok: true }
  | { ok: false; reason: 'nickname' | 'role' | 'duplicate' | 'full' };

const STORAGE_KEY = 'pokemon-team';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly members = signal<TeamMember[]>(this.load());

  has(id: number): boolean {
    return this.members().some((member) => member.id === id);
  }

  add(member: TeamMember): TeamAddResult {
    const nickname = member.nickname.trim();
    if (nickname.length < 3 || nickname.length > 12) return { ok: false, reason: 'nickname' };
    if (!isTeamRole(member.role)) return { ok: false, reason: 'role' };

    const current = this.members();
    if (current.some((entry) => entry.id === member.id)) return { ok: false, reason: 'duplicate' };
    if (current.length >= TEAM_LIMIT) return { ok: false, reason: 'full' };

    this.save([...current, { ...member, nickname }]);
    return { ok: true };
  }

  private load(): TeamMember[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isTeamMember).slice(0, TEAM_LIMIT);
    } catch {
      return [];
    }
  }

  private save(members: TeamMember[]): void {
    this.members.set(members);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }
}

function isTeamRole(value: string): value is TeamRole {
  return (TEAM_ROLES as readonly string[]).includes(value);
}

function isTeamMember(value: unknown): value is TeamMember {
  if (!value || typeof value !== 'object') return false;
  const member = value as TeamMember;
  return (
    typeof member.id === 'number' &&
    typeof member.name === 'string' &&
    typeof member.nickname === 'string' &&
    typeof member.role === 'string' &&
    isTeamRole(member.role) &&
    (member.sprite === null || typeof member.sprite === 'string')
  );
}
