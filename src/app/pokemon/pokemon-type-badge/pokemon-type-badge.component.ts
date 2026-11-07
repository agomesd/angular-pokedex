import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { BrnTooltip, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip';
import { typeBackground } from '../utils/type-colour';

@Component({
  selector: 'app-pokemon-type-badge',
  templateUrl: './pokemon-type-badge.component.html',
  host: { class: 'inline-flex' },
  imports: [NgOptimizedImage, TitleCasePipe, BrnTooltip],
  providers: [
    provideBrnTooltipDefaultOptions({
      tooltipContentClasses:
        'bg-popover text-popover-foreground z-50 w-max max-w-40 rounded-md px-2 py-1.5 text-xs shadow-md ring-1 ring-foreground/10',
      arrowClasses: () => 'hidden',
    }),
  ],
})
export class PokemonTypeBadge {
  readonly name = input.required<string>();
  readonly icon = input.required<string>();
  readonly size = input<'sm' | 'md'>('md');
  readonly position = input<'top' | 'bottom' | 'left' | 'right'>('bottom');

  protected readonly label = computed(() => this.name());
  protected readonly dimension = computed(() => (this.size() === 'sm' ? 24 : 32));
  protected readonly badgeClass = computed(() => {
    const size = this.size() === 'sm' ? 'size-6 sm:size-7' : 'size-8';
    return `${size} ${typeBackground(this.name())}`;
  });
}
