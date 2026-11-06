import { SpriteVersions } from '../pokemon.service';
import { generationsNewestFirst } from './generation-order';

export function latestFrontDefault(
  versions: SpriteVersions | undefined,
): string | null {
  if (!versions) return null;

  for (const generation of generationsNewestFirst(Object.keys(versions))) {
    const games = versions[generation];
    if (!games) continue;

    for (const [game, sprites] of Object.entries(games)) {
      if (game === 'icons') continue;
      const url = sprites?.front_default;
      if (url) return url;
    }
  }

  return null;
}
