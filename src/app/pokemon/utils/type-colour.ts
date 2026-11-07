const TYPE_COLOURS: Record<string, string> = {
  normal: 'text-gray-500',
  fighting: 'text-red-500',
  flying: 'text-sky-500',
  poison: 'text-purple-500',
  ground: 'text-amber-500',
  rock: 'text-yellow-600',
  bug: 'text-lime-600',
  ghost: 'text-violet-500',
  steel: 'text-slate-500',
  fire: 'text-orange-500',
  water: 'text-blue-500',
  grass: 'text-green-500',
  electric: 'text-yellow-500',
  psychic: 'text-pink-500',
  ice: 'text-cyan-500',
  dragon: 'text-indigo-500',
  dark: 'text-stone-700',
  fairy: 'text-pink-400',
  stellar: 'text-teal-500',
  unknown: 'text-gray-400',
  shadow: 'text-zinc-700',
};

const TYPE_BACKGROUNDS: Record<string, string> = {
  normal: 'bg-gray-500',
  fighting: 'bg-red-500',
  flying: 'bg-sky-500',
  poison: 'bg-purple-500',
  ground: 'bg-amber-500',
  rock: 'bg-yellow-600',
  bug: 'bg-lime-600',
  ghost: 'bg-violet-500',
  steel: 'bg-slate-500',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-500',
  psychic: 'bg-pink-500',
  ice: 'bg-cyan-500',
  dragon: 'bg-indigo-500',
  dark: 'bg-stone-700',
  fairy: 'bg-pink-400',
  stellar: 'bg-teal-500',
  unknown: 'bg-gray-400',
  shadow: 'bg-zinc-700',
};

export function typeColour(name: string): string {
  return TYPE_COLOURS[name] ?? 'text-gray-500';
}

const TYPE_CHECKED_TRACKS: Record<string, string> = {
  normal: 'data-checked:bg-gray-500',
  fighting: 'data-checked:bg-red-500',
  flying: 'data-checked:bg-sky-500',
  poison: 'data-checked:bg-purple-500',
  ground: 'data-checked:bg-amber-500',
  rock: 'data-checked:bg-yellow-600',
  bug: 'data-checked:bg-lime-600',
  ghost: 'data-checked:bg-violet-500',
  steel: 'data-checked:bg-slate-500',
  fire: 'data-checked:bg-orange-500',
  water: 'data-checked:bg-blue-500',
  grass: 'data-checked:bg-green-500',
  electric: 'data-checked:bg-yellow-500',
  psychic: 'data-checked:bg-pink-500',
  ice: 'data-checked:bg-cyan-500',
  dragon: 'data-checked:bg-indigo-500',
  dark: 'data-checked:bg-stone-700',
  fairy: 'data-checked:bg-pink-400',
  stellar: 'data-checked:bg-teal-500',
  unknown: 'data-checked:bg-gray-400',
  shadow: 'data-checked:bg-zinc-700',
};

export function typeBackground(name: string): string {
  return TYPE_BACKGROUNDS[name] ?? 'bg-gray-500';
}

export function typeCheckedTrack(name: string): string {
  return TYPE_CHECKED_TRACKS[name] ?? 'data-checked:bg-gray-500';
}
