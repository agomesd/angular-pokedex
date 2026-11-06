import { TypeSprites } from '../pokemon.service';
import { generationsNewestFirst } from './generation-order';

export function latestSymbolIcon(
  sprites: TypeSprites | undefined,
): string | null {
  if (!sprites) return null;

  for (const generation of generationsNewestFirst(Object.keys(sprites))) {
    const games = sprites[generation];
    if (!games) continue;

    for (const game of Object.values(games)) {
      const url = game?.symbol_icon;
      if (url) return url;
    }
  }

  return null;
}