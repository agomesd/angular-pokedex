import { Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowBigLeft,
  lucideArrowBigLeftDash,
  lucideArrowBigRight,
  lucideArrowBigRightDash,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-pokemon-pagination',
  templateUrl: './pokemon-pagination.component.html',
  imports: [NgIcon, HlmButton],
  providers: [
    provideIcons({
      lucideArrowBigLeft,
      lucideArrowBigLeftDash,
      lucideArrowBigRight,
      lucideArrowBigRightDash,
    }),
  ],
})
export class PokemonPagination {
  readonly page = input.required<number>();
  readonly hasNext = input(false);
  readonly lastPage = input<number | null>(null);
  readonly pageChange = output<number>();

  protected readonly canGoPrevious = computed(() => this.page() > 1);
  protected readonly canGoNext = computed(() => this.hasNext());
  protected readonly canSkipPrevious = computed(() => this.page() > 10);
  protected readonly canSkipNext = computed(() => {
    const lastPage = this.lastPage();
    return lastPage != null && this.page() + 10 <= lastPage;
  });

  protected previous(): void {
    if (!this.canGoPrevious()) return;
    this.pageChange.emit(this.page() - 1);
  }

  protected next(): void {
    if (!this.canGoNext()) return;
    this.pageChange.emit(this.page() + 1);
  }

  protected skipPrevious(): void {
    if (!this.canSkipPrevious()) return;
    this.pageChange.emit(this.page() - 10);
  }

  protected skipNext(): void {
    if (!this.canSkipNext()) return;
    this.pageChange.emit(this.page() + 10);
  }
}
