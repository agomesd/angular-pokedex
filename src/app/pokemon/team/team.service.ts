import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';

export const TEAM_LIMIT = 6;

export const TEAM_ROLES = ['Attacker', 'Defender', 'Support'] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_ICON: Record<TeamRole, string> = {
  Attacker: 'lucideSword',
  Defender: 'lucideShield',
  Support: 'lucideCross',
};

export type TeamMember = {
  id: number;
  name: string;
  sprite: string | null;
  nickname: string;
  role: TeamRole;
};

export type TeamSlot = TeamMember | null;

export type TeamAddResult =
  | { ok: true }
  | { ok: false; reason: 'duplicate' | 'full' | 'nickname' | 'role' };

const STORAGE_KEY = 'pokemon-team';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly slots = signal<TeamSlot[]>(emptySlots());
  readonly members = computed(() => this.slots().filter((slot): slot is TeamMember => slot !== null));

  constructor() {
    afterNextRender(() => {
      const stored = this.readStorage();
      if (stored) this.slots.set(stored);
    });
  }

  has(id: number): boolean {
    return this.slots().some((slot) => slot?.id === id);
  }

  add(member: TeamMember): TeamAddResult {
    const current = this.slots();
    if (current.some((slot) => slot?.id === member.id)) return { ok: false, reason: 'duplicate' };

    const index = current.findIndex((slot) => slot === null);
    if (index === -1) return { ok: false, reason: 'full' };

    const nickname = normalizeNickname(member.nickname);
    if (!nickname) return { ok: false, reason: 'nickname' };
    if (!isTeamRole(member.role)) return { ok: false, reason: 'role' };

    const next = current.slice();
    next[index] = {
      id: member.id,
      name: member.name,
      sprite: member.sprite,
      nickname,
      role: member.role,
    };
    this.save(next);
    return { ok: true };
  }

  setRole(id: number, role: TeamRole): void {
    if (!isTeamRole(role)) return;
    const current = this.slots();
    const index = current.findIndex((slot) => slot?.id === id);
    const member = current[index];
    if (!member || member.role === role) return;
    const next = current.slice();
    next[index] = { ...member, role };
    this.save(next);
  }

  remove(id: number): void {
    const current = this.slots();
    if (!current.some((slot) => slot?.id === id)) return;
    this.save(current.map((slot) => (slot?.id === id ? null : slot)));
  }

  move(from: number, to: number): void {
    if (from === to || !isSlotIndex(from) || !isSlotIndex(to)) return;
    const next = this.slots().slice();
    if (!next[from]) return;
    [next[from], next[to]] = [next[to], next[from]];
    this.save(next);
  }

  private readStorage(): TeamSlot[] | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return slotsFromStorage(parsed);
    } catch {
      return null;
    }
  }

  private save(slots: TeamSlot[]): void {
    this.slots.set(slots);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }
}

function emptySlots(): TeamSlot[] {
  return Array.from({ length: TEAM_LIMIT }, () => null);
}

function isSlotIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < TEAM_LIMIT;
}

function slotsFromStorage(parsed: unknown[]): TeamSlot[] {
  const slots = emptySlots();
  const seen = new Set<number>();
  const keepsPosition = parsed.length === TEAM_LIMIT && parsed.some((value) => value === null);

  if (keepsPosition) {
    parsed.forEach((value, index) => {
      const member = toMember(value);
      if (!member || seen.has(member.id)) return;
      seen.add(member.id);
      slots[index] = member;
    });
    return slots;
  }

  let index = 0;
  for (const value of parsed) {
    const member = toMember(value);
    if (!member || seen.has(member.id)) continue;
    seen.add(member.id);
    slots[index] = member;
    index += 1;
    if (index === TEAM_LIMIT) break;
  }
  return slots;
}

function toMember(value: unknown): TeamMember | null {
  if (!value || typeof value !== 'object') return null;
  const member = value as Partial<TeamMember>;
  if (typeof member.id !== 'number' || typeof member.name !== 'string') return null;
  if (member.sprite !== null && typeof member.sprite !== 'string') return null;

  const nickname =
    (typeof member.nickname === 'string' ? normalizeNickname(member.nickname) : null) ??
    legacyNickname(member.name);
  const role = isTeamRole(member.role) ? member.role : 'Attacker';

  return { id: member.id, name: member.name, sprite: member.sprite ?? null, nickname, role };
}

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === 'string' && (TEAM_ROLES as readonly string[]).includes(value);
}

export function normalizeNickname(value: string): string | null {
  const nickname = value.trim();
  if (nickname.length < 3 || nickname.length > 12) return null;
  return nickname;
}

function legacyNickname(name: string): string {
  const trimmed = name.trim();
  return trimmed.length <= 12 ? trimmed : trimmed.slice(0, 12);
}
