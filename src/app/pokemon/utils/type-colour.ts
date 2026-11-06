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

export function typeColour(name: string): string {
  return TYPE_COLOURS[name] ?? 'text-gray-500';
}
