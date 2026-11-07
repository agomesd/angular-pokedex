import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { PokemonDetails } from '../pokemon-details/pokemon-details.component';
import { Pokemon, PokemonService, PokemonType } from '../pokemon.service';

type SheetState =
  | { status: 'loading' }
  | { status: 'found'; pokemon: Pokemon }
  | { status: 'error' };

@Component({
  selector: 'app-pokemon-detail-sheet',
  templateUrl: './pokemon-detail-sheet.component.html',
  host: { class: 'contents' },
  imports: [TitleCasePipe, NgIcon, HlmButton, HlmSheetImports, BrnSheetContent, PokemonDetails],
  providers: [provideIcons({ lucideInfo })],
})
export class PokemonDetailSheet {
  private readonly pokemonService = inject(PokemonService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pokemon = input<Pokemon | null>(null);
  readonly types = input<PokemonType[]>();
  readonly pokemonId = input<number | null>(null);
  readonly name = input('');
  readonly trigger = input<'text' | 'icon'>('text');
  readonly label = input<string | null>(null);

  protected readonly state = signal<SheetState | null>(null);
  private request = 0;
  private seenId: number | null = null;

  constructor() {
    effect(() => {
      const provided = this.pokemon();
      if (provided) {
        this.state.set({ status: 'found', pokemon: provided });
        return;
      }

      const id = this.pokemonId();
      if (id === this.seenId) return;
      this.seenId = id;
      this.state.set(null);
    });
  }

  protected load(): void {
    const provided = this.pokemon();
    if (provided) {
      this.state.set({ status: 'found', pokemon: provided });
      return;
    }

    const id = this.pokemonId();
    if (id == null) {
      this.state.set({ status: 'loading' });
      return;
    }

    const request = ++this.request;
    this.state.set({ status: 'loading' });
    this.pokemonService
      .getPokemon(String(id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pokemon) => {
          if (request !== this.request) return;
          this.state.set({ status: 'found', pokemon });
        },
        error: () => {
          if (request !== this.request) return;
          this.state.set({ status: 'error' });
        },
      });
  }
}
