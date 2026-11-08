import { afterNextRender, Component, computed, inject, Injector, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideCross, lucideShield, lucideSword } from '@ng-icons/lucide';
import { BrnTooltip, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip';

export type SelectOption = {
  value: string;
  label: string;
  icon?: string;
};

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  imports: [NgIcon, BrnTooltip],
  providers: [
    provideIcons({ lucideChevronDown, lucideSword, lucideShield, lucideCross }),
    provideBrnTooltipDefaultOptions({
      tooltipContentClasses:
        'bg-popover text-popover-foreground z-50 w-max max-w-40 rounded-md px-2 py-1.5 text-xs shadow-md ring-1 ring-foreground/10',
      arrowClasses: () => 'hidden',
    }),
  ],
})
export class Select {
  private readonly injector = inject(Injector);

  readonly controlId = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly value = input<string>('');
  readonly placeholder = input('Select');
  readonly invalid = input(false);
  readonly describedBy = input<string | null>(null);
  readonly size = input<'sm' | 'md'>('sm');
  readonly appearance = input<'field' | 'icon'>('field');
  readonly ariaLabel = input<string | null>(null);
  readonly tooltip = input<string | null>(null);

  readonly valueChange = output<string>();
  readonly openChange = output<boolean>();

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly tooltipSuppressed = signal(false);
  protected readonly selected = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null,
  );
  protected readonly triggerClass = computed(() => {
    if (this.appearance() === 'icon') {
      return 'inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/70 text-indigo-950 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-8';
    }
    const size = this.size() === 'md' ? 'h-9 px-3 text-sm' : 'h-7 px-2 text-xs';
    return `border-input bg-background flex w-full cursor-pointer items-center gap-2 rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-ring ${size}`;
  });
  protected readonly menuClass = computed(() =>
    this.appearance() === 'icon'
      ? 'bg-popover absolute top-full right-0 z-20 mt-1 w-max rounded-md border p-1 shadow-md'
      : 'bg-popover absolute z-20 mt-1 w-full rounded-md border p-1 shadow-md',
  );
  protected readonly tooltipDisabled = computed(
    () => !this.tooltip() || this.open() || this.tooltipSuppressed(),
  );

  protected toggle(): void {
    const open = !this.open();
    this.open.set(open);
    this.activeIndex.set(open ? this.startingIndex(1) : -1);
    this.openChange.emit(open);
  }

  protected onTriggerPointerDown(event: PointerEvent): void {
    if (this.appearance() !== 'icon') return;
    const button = event.currentTarget;
    if (button instanceof HTMLElement) {
      button.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true, pointerType: 'mouse' }));
    }
    this.tooltipSuppressed.set(true);
  }

  closeMenu(): void {
    if (!this.open()) return;
    this.close(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const key = event.key;

    if (key === 'Escape') {
      if (!this.open()) return;
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      const direction = key === 'ArrowDown' ? 1 : -1;
      if (!this.open()) {
        this.open.set(true);
        this.activeIndex.set(this.startingIndex(direction));
        this.openChange.emit(true);
        this.focusActive();
        return;
      }
      this.moveActive(direction);
      this.focusActive();
      return;
    }

    if (key.length === 1 && /^[a-z]$/i.test(key)) {
      const match = this.options().find((option) => option.label.toLowerCase().startsWith(key.toLowerCase()));
      if (!match) return;
      event.preventDefault();
      this.choose(match.value);
    }
  }

  protected choose(value: string): void {
    this.valueChange.emit(value);
    this.close(true);
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    const current = event.currentTarget;
    if (next instanceof Node && current instanceof Node && current.contains(next)) return;
    this.close(false);
  }

  private close(restoreFocus: boolean): void {
    const wasOpen = this.open();
    this.open.set(false);
    this.activeIndex.set(-1);
    if (wasOpen) this.openChange.emit(false);
    if (restoreFocus) document.getElementById(this.controlId())?.focus();
  }

  private startingIndex(direction: 1 | -1): number {
    const selected = this.options().findIndex((option) => option.value === this.value());
    if (selected >= 0) return selected;
    return direction === 1 ? 0 : this.options().length - 1;
  }

  private moveActive(direction: 1 | -1): void {
    const current = this.activeIndex();
    const start = current < 0 ? this.startingIndex(direction) : current;
    const next = current < 0 ? start : start + direction;
    this.activeIndex.set(Math.min(this.options().length - 1, Math.max(0, next)));
  }

  private focusActive(): void {
    const optionId = `${this.controlId()}-option-${this.activeIndex()}`;
    afterNextRender(() => document.getElementById(optionId)?.focus(), { injector: this.injector });
  }
}
