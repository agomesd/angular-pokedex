import { NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, effect, input, signal, viewChild } from '@angular/core';
import { PokeballSpinner } from '../pokeball-spinner/pokeball-spinner.component';

@Component({
  selector: 'app-pokemon-sprite',
  templateUrl: './pokemon-sprite.component.html',
  imports: [NgOptimizedImage, PokeballSpinner],
  host: { class: 'absolute inset-0' },
})
export class PokemonSprite {
  readonly src = input.required<string>();
  readonly alt = input.required<string>();
  readonly priority = input(false);
  readonly pixelated = input(false);
  readonly spinnerSize = input<'md' | 'lg'>('md');

  private readonly image = viewChild<ElementRef<HTMLImageElement>>('sprite');
  protected readonly shownSrc = signal<string | null>(null);
  protected readonly failedSrc = signal<string | null>(null);

  constructor() {
    effect(() => {
      const src = this.src();
      const image = this.image()?.nativeElement;
      this.shownSrc.set(image && imageIsReady(image, src) ? src : null);
    });
  }

  protected loaded(src: string): boolean {
    return this.shownSrc() === src;
  }

  protected failed(src: string): boolean {
    return this.failedSrc() === src;
  }

  protected onLoad(src: string, event: Event): void {
    const image = event.target;
    if (image instanceof HTMLImageElement && imageIsReady(image, src)) {
      this.shownSrc.set(src);
    }
  }

  protected onError(src: string): void {
    this.failedSrc.set(src);
    if (this.shownSrc() === src) this.shownSrc.set(null);
  }
}

function imageIsReady(image: HTMLImageElement, src: string): boolean {
  if (!image.complete || image.naturalWidth === 0) return false;
  return image.currentSrc === src || image.getAttribute('src') === src;
}
