import { isPlatformBrowser } from '@angular/common';
import { Component, Injector, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { TeamSlotComponent } from '../pokemon/team/team-slot/team-slot.component';
import { TEAM_LIMIT, TeamService } from '../pokemon/team/team.service';

const COLUMNS = 3;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [TeamSlotComponent],
})
export class DashboardComponent {
  private readonly team = inject(TeamService);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly slots = this.team.slots;
  protected readonly dragging = signal<number | null>(null);
  protected readonly over = signal<number | null>(null);

  private drag: { index: number; pointerId: number; x: number; y: number; moved: boolean } | null = null;
  private nativeDrag = false;

  protected pointerDown(index: number, event: PointerEvent): void {
    if (!this.isBrowser || event.button !== 0 || !this.slots()[index]) return;
    const handle = event.currentTarget;
    if (!(handle instanceof HTMLElement)) return;
    handle.setPointerCapture(event.pointerId);
    this.drag = { index, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    this.dragging.set(index);
    this.over.set(index);
  }

  protected pointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4) drag.moved = true;
    this.over.set(slotIndexAt(event.clientX, event.clientY));
  }

  protected dragStart(index: number, event: DragEvent): void {
    if (!this.slots()[index]) {
      event.preventDefault();
      return;
    }
    this.nativeDrag = true;
    this.drag = null;
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    this.dragging.set(index);
  }

  protected dragOver(index: number, event: DragEvent): void {
    if (!this.nativeDrag) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.over.set(index);
  }

  protected drop(index: number, event: DragEvent): void {
    event.preventDefault();
    const from = Number(event.dataTransfer?.getData('text/plain'));
    this.finishNativeDrag();
    if (!Number.isInteger(from) || from === index) return;
    this.team.move(from, index);
  }

  protected dragEnd(): void {
    this.finishNativeDrag();
  }

  protected pointerUp(event: PointerEvent): void {
    if (this.nativeDrag) return;
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const from = drag.index;
    const moved = drag.moved;
    const to = this.over();
    this.drag = null;
    this.dragging.set(null);
    this.over.set(null);
    if (!moved || to === null || to === from) return;
    this.team.move(from, to);
    this.focusSlot(to);
  }

  protected pointerCancel(event: PointerEvent): void {
    if (this.drag?.pointerId !== event.pointerId) return;
    this.drag = null;
    this.dragging.set(null);
    this.over.set(null);
  }

  protected remove(id: number): void {
    this.team.remove(id);
  }

  protected onKeydown(index: number, event: KeyboardEvent): void {
    const target = neighbor(index, event.key);
    if (target === null || !this.slots()[index]) return;
    event.preventDefault();
    this.team.move(index, target);
    this.focusSlot(target);
  }

  private finishNativeDrag(): void {
    this.nativeDrag = false;
    this.drag = null;
    this.dragging.set(null);
    this.over.set(null);
  }

  private focusSlot(index: number): void {
    if (!this.isBrowser) return;
    afterNextRender(
      () => document.querySelector<HTMLElement>(`[data-team-slot="${index}"] [data-reorder]`)?.focus(),
      { injector: this.injector },
    );
  }
}

function neighbor(index: number, key: string): number | null {
  if (key === 'ArrowLeft') return index % COLUMNS === 0 ? null : index - 1;
  if (key === 'ArrowRight') return index % COLUMNS === COLUMNS - 1 ? null : index + 1;
  if (key === 'ArrowUp') return index - COLUMNS >= 0 ? index - COLUMNS : null;
  if (key === 'ArrowDown') return index + COLUMNS < TEAM_LIMIT ? index + COLUMNS : null;
  return null;
}

function slotIndexAt(x: number, y: number): number | null {
  const hit = document.elementFromPoint(x, y);
  const slot = hit?.closest<HTMLElement>('[data-team-slot]');
  if (!slot) return null;
  const index = Number(slot.dataset['teamSlot']);
  return Number.isInteger(index) ? index : null;
}
