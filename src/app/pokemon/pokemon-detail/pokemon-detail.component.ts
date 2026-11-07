import { DecimalPipe, isPlatformBrowser, NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideVolume2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSwitch } from '@spartan-ng/helm/switch';
import { catchError, forkJoin, map, Observable, of, startWith, switchMap } from 'rxjs';
import { PokemonSprite } from '../pokemon-sprite/pokemon-sprite.component';
import { Pokemon, PokemonService, PokemonSpecies, PokemonType } from '../pokemon.service';
import { isPokemonNotFound } from '../utils/is-pokemon-not-found';
import { latestSymbolIcon } from '../utils/latest-symbol-icon';
import { normalizeSearch } from '../utils/normalize-search';
import { generationLabel } from '../utils/generation-order';
import { englishGenus, genderLabel, hatchSteps, pokedexEntry } from '../utils/species-summary';
import { artworkFrames, GameView, generationViews, GenerationView } from '../utils/sprite-gallery';
import { typeColour } from '../utils/type-colour';

function pokemonPageId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

type PokemonDetailState =
  | { status: 'loading'; query: string }
  | {
      status: 'found';
      query: string;
      pokemon: Pokemon;
      types: PokemonType[];
      species: PokemonSpecies | null;
    }
  | { status: 'not-found'; query: string }
  | { status: 'network-error'; query: string };

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-detail.component.html',
  imports: [RouterLink, TitleCasePipe, DecimalPipe, NgOptimizedImage, HlmButton, HlmSwitch, NgIcon, PokemonSprite],
  providers: [provideIcons({ lucideVolume2 })],
})
export class PokemonDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pokemonService = inject(PokemonService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly reload = signal(0);
  private readonly cry = viewChild<ElementRef<HTMLAudioElement>>('cry');
  private readonly viewedId = signal<number | null>(null);
  private servedReload = -1;

  protected readonly generation = signal<string | null>(null);
  protected readonly gameId = signal<string | null>(null);
  protected readonly shiny = signal(false);
  protected readonly back = signal(false);

  private readonly idParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly request = computed(() => ({
    id: this.idParam(),
    reload: this.reload(),
  }));

  protected readonly state = toSignal(
    toObservable(this.request).pipe(switchMap(({ id, reload }) => this.load(id, reload))),
    { initialValue: { status: 'loading', query: '' } as PokemonDetailState },
  );

  protected readonly previousId = computed(() => {
    const id = this.pageId();
    return id !== null && id > 1 ? id - 1 : null;
  });

  protected readonly nextId = computed(() => {
    const id = this.pageId();
    return id === null ? null : id + 1;
  });

  private readonly found = computed(() => {
    const state = this.state();
    return state.status === 'found' ? state : null;
  });

  protected readonly gallery = computed(() => {
    const pokemon = this.found()?.pokemon;
    return pokemon ? generationViews(pokemon.sprites) : [];
  });

  protected readonly selectedGeneration = computed(
    () => this.gallery().find((entry) => entry.id === this.generation()) ?? null,
  );

  protected readonly portrait = computed(() => {
    const pokemon = this.found()?.pokemon;
    if (!pokemon) return null;

    const generation = this.selectedGeneration();
    const game = generation?.games.find((entry) => entry.id === this.gameId()) ?? generation?.games[0];
    const frames = game?.frames ?? artworkFrames(pokemon.sprites);
    const backFrame = this.shiny() ? frames.backShiny ?? frames.back : frames.back;
    const useBack = this.back() && backFrame !== null;
    const shinyFrame = useBack ? frames.backShiny : frames.frontShiny;
    const useShiny = this.shiny() && shinyFrame !== null;
    const name = pokemon.name;

    return {
      src: useBack
        ? useShiny
          ? frames.backShiny
          : frames.back
        : useShiny
          ? frames.frontShiny
          : frames.front,
      pixelated: game !== undefined,
      canShiny: shinyFrame !== null,
      canBack: backFrame !== null,
      caption: game ? `${generation?.label} · ${game.label}` : 'Official artwork',
      alt: game ? `${name}, ${game.label}` : `${name} official artwork`,
    };
  });

  protected readonly genus = computed(() => englishGenus(this.found()?.species ?? null));

  protected readonly entry = computed(() => pokedexEntry(this.found()?.species ?? null, this.gameId()));

  protected readonly typeColour = typeColour;
  protected readonly generationLabel = generationLabel;
  protected readonly genderLabel = genderLabel;
  protected readonly hatchSteps = hatchSteps;

  constructor() {
    effect(() => {
      const id = this.found()?.pokemon.id ?? null;
      if (id === this.viewedId()) return;
      this.viewedId.set(id);
      this.generation.set(null);
      this.gameId.set(null);
      this.shiny.set(false);
      this.back.set(false);
    });

    effect(() => {
      if (!this.isBrowser) return;
      const state = this.state();
      const param = this.idParam();
      if (state.status !== 'found' || state.query !== normalizeSearch(param)) return;
      const id = String(state.pokemon.id);
      if (param === id) return;
      void this.router.navigate(['/pokemon', id], { replaceUrl: true });
    });
  }

  protected retry(): void {
    this.reload.update((value) => value + 1);
  }

  protected showArtwork(): void {
    this.generation.set(null);
    this.gameId.set(null);
  }

  protected showGeneration(generation: GenerationView): void {
    this.generation.set(generation.id);
    this.gameId.set(generation.games[0]?.id ?? null);
  }

  protected showGame(game: GameView): void {
    this.gameId.set(game.id);
  }

  protected playCry(): void {
    const audio = this.cry()?.nativeElement;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play();
  }

  protected typeIcon(types: PokemonType[], name: string): string | null {
    const type = types.find((entry) => entry.name === name);
    return type ? latestSymbolIcon(type.sprites) : null;
  }

  protected heightInMetres(decimetres: number): string {
    return `${(decimetres / 10).toFixed(1)} m`;
  }

  protected weightInKilograms(hectograms: number): string {
    return `${(hectograms / 10).toFixed(1)} kg`;
  }

  protected statLabel(name: string): string {
    return STAT_LABELS[name] ?? name;
  }

  protected statWidth(value: number): number {
    return Math.min(100, (value / 255) * 100);
  }

  protected statTotal(pokemon: Pokemon): number {
    return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  private pageId(): number | null {
    const fromUrl = pokemonPageId(this.idParam());
    if (fromUrl !== null) return fromUrl;

    const state = this.state();
    if (state.status === 'found' && state.query === normalizeSearch(this.idParam())) {
      return state.pokemon.id;
    }
    return null;
  }

  private load(name: string, reload: number): Observable<PokemonDetailState> {
    const query = normalizeSearch(name);
    if (!query) {
      return of<PokemonDetailState>({ status: 'not-found', query });
    }

    const current = this.state();
    if (
      current.status === 'found' &&
      this.servedReload === reload &&
      (current.query === query || String(current.pokemon.id) === query)
    ) {
      return of(current.query === query ? current : { ...current, query });
    }

    return this.pokemonService.getPokemon(query).pipe(
      switchMap((pokemon) => {
        const urls = pokemon.types.map((entry) => entry.type.url);
        const types$ = urls.length
          ? forkJoin(urls.map((url) => this.pokemonService.getType(url))).pipe(
              catchError(() => of([] as PokemonType[])),
            )
          : of([] as PokemonType[]);
        const species$ = this.pokemonService.getSpecies(pokemon.species.url).pipe(
          catchError(() => of(null)),
        );

        return forkJoin({ types: types$, species: species$ }).pipe(
          map(({ types, species }) => {
            this.servedReload = reload;
            return { status: 'found' as const, query, pokemon, types, species };
          }),
        );
      }),
      catchError((error: unknown) =>
        of<PokemonDetailState>(
          isPokemonNotFound(error)
            ? { status: 'not-found', query }
            : { status: 'network-error', query },
        ),
      ),
      startWith<PokemonDetailState>({ status: 'loading', query }),
    );
  }
}
