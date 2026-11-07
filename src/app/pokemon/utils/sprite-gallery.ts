import { GameSprites, PokemonSprites, SpriteFrame } from '../pokemon.service';
import { generationLabel, generationNumeral, generationsOldestFirst } from './generation-order';

export type SpriteFrames = {
  front: string | null;
  frontShiny: string | null;
  back: string | null;
  backShiny: string | null;
};

export type GameView = {
  id: string;
  label: string;
  frames: SpriteFrames;
};

export type GenerationView = {
  id: string;
  label: string;
  numeral: string;
  games: GameView[];
};

const GAME_LABELS: Record<string, string> = {
  'red-green-japan': 'Red & Green',
  'red-blue': 'Red & Blue',
  yellow: 'Yellow',
  gold: 'Gold',
  silver: 'Silver',
  crystal: 'Crystal',
  'ruby-sapphire': 'Ruby & Sapphire',
  emerald: 'Emerald',
  'firered-leafgreen': 'FireRed & LeafGreen',
  'diamond-pearl': 'Diamond & Pearl',
  platinum: 'Platinum',
  'heartgold-soulsilver': 'HeartGold & SoulSilver',
  'black-white': 'Black & White',
  'black-2-white-2': 'Black 2 & White 2',
  'x-y': 'X & Y',
  'omega-ruby-alpha-sapphire': 'Omega Ruby & Alpha Sapphire',
  'sun-moon': 'Sun & Moon',
  'ultra-sun-ultra-moon': 'Ultra Sun & Ultra Moon',
  'lets-go-pikachu-lets-go-eevee': "Let's Go",
  'sword-shield': 'Sword & Shield',
  'brilliant-diamond-shining-pearl': 'Brilliant Diamond & Shining Pearl',
  'legends-arceus': 'Legends: Arceus',
  'scarlet-violet': 'Scarlet & Violet',
  'legends-za': 'Legends: Z-A',
  champions: 'Champions',
  icons: 'Menu icon',
};

const GAME_ORDER = Object.keys(GAME_LABELS);

export function artworkFrames(sprites: PokemonSprites): SpriteFrames {
  const official = sprites.other?.['official-artwork'];
  const home = sprites.other?.home;
  return {
    front: spriteUrl(official?.front_default) ?? spriteUrl(home?.front_default) ?? spriteUrl(sprites.front_default),
    frontShiny: spriteUrl(official?.front_shiny) ?? spriteUrl(home?.front_shiny) ?? spriteUrl(sprites.front_shiny),
    back: null,
    backShiny: null,
  };
}

export function generationViews(sprites: PokemonSprites): GenerationView[] {
  return generationsOldestFirst(Object.keys(sprites.versions))
    .map((generation) => {
      const games = Object.entries(sprites.versions[generation] ?? {})
        .map(([id, game]) => ({ id, label: gameLabel(id), frames: framesOf(game) }))
        .filter((game) => hasFrame(game.frames))
        .sort((a, b) => gameRank(a.id) - gameRank(b.id));

      return {
        id: generation,
        label: generationLabel(generation),
        numeral: generationNumeral(generation),
        games,
      };
    })
    .filter((generation) => generation.games.length > 0);
}

function framesOf(game: GameSprites): SpriteFrames {
  const animated = game.animated ?? {};
  const icons = game.icons ?? {};
  return {
    front:
      spriteUrl(animated.front_default) ??
      spriteUrl(game.front_default) ??
      spriteUrl(game.front_gray) ??
      spriteUrl(icons.front_default),
    frontShiny: spriteUrl(animated.front_shiny) ?? spriteUrl(game.front_shiny) ?? spriteUrl(icons.front_shiny),
    back:
      spriteUrl(animated.back_default) ??
      spriteUrl(game.back_default) ??
      spriteUrl(game.back_gray) ??
      spriteUrl(icons.back_default),
    backShiny: spriteUrl(animated.back_shiny) ?? spriteUrl(game.back_shiny) ?? spriteUrl(icons.back_shiny),
  };
}

function hasFrame(frames: SpriteFrames): boolean {
  return frames.front !== null || frames.frontShiny !== null || frames.back !== null || frames.backShiny !== null;
}

function gameLabel(id: string): string {
  return (
    GAME_LABELS[id] ??
    id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

function gameRank(id: string): number {
  const index = GAME_ORDER.indexOf(id);
  return index === -1 ? GAME_ORDER.length : index;
}

function spriteUrl(value: SpriteFrame[keyof SpriteFrame]): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
