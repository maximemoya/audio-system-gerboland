export type TerrainAudioKey =
  | 'normal'
  | 'feu'
  | 'eau'
  | 'plante'
  | 'electrique'
  | 'glace'
  | 'combat'
  | 'poison'
  | 'sol'
  | 'vol'
  | 'psy'
  | 'insecte'
  | 'roche'
  | 'spectre'
  | 'dragon'
  | 'tenebres'
  | 'acier'
  | 'fee';

const TERRAIN_ALIASES: Record<string, TerrainAudioKey> = {
  normal: 'normal',
  feu: 'feu',
  fire: 'feu',
  eau: 'eau',
  water: 'eau',
  plante: 'plante',
  grass: 'plante',
  electrique: 'electrique',
  electric: 'electrique',
  glace: 'glace',
  ice: 'glace',
  combat: 'combat',
  fighting: 'combat',
  poison: 'poison',
  sol: 'sol',
  ground: 'sol',
  vol: 'vol',
  flying: 'vol',
  psy: 'psy',
  psychic: 'psy',
  insecte: 'insecte',
  bug: 'insecte',
  roche: 'roche',
  rock: 'roche',
  spectre: 'spectre',
  ghost: 'spectre',
  dragon: 'dragon',
  tenebres: 'tenebres',
  dark: 'tenebres',
  acier: 'acier',
  steel: 'acier',
  fee: 'fee',
  fairy: 'fee'
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const normalizeTerrainKey = (value?: string | null): TerrainAudioKey => {
  if (!value) return 'normal';

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');

  return TERRAIN_ALIASES[normalized] ?? 'normal';
};

export const buildEuclideanPattern = (pulses: number, steps: number): boolean[] => {
  if (steps <= 0) return [];
  const safePulses = clamp(Math.round(pulses), 0, steps);
  const pattern: boolean[] = [];
  let bucket = 0;

  for (let index = 0; index < steps; index += 1) {
    bucket += safePulses;
    if (bucket >= steps) {
      bucket -= steps;
      pattern.push(true);
    } else {
      pattern.push(false);
    }
  }

  return pattern;
};

export const rotatePattern = (pattern: boolean[], rotation: number): boolean[] => {
  if (pattern.length === 0) return [];
  const offset = ((rotation % pattern.length) + pattern.length) % pattern.length;
  if (offset === 0) return [...pattern];
  return pattern.slice(-offset).concat(pattern.slice(0, -offset));
};

const hashSeed = (seed: number | string): number => {
  if (typeof seed === 'number') {
    return seed >>> 0;
  }

  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const createSeededRandom = (seed: number | string): (() => number) => {
  let state = hashSeed(seed) || 0x6d2b79f5;

  return () => {
    state += 0x6d2b79f5;
    let temp = state;
    temp = Math.imul(temp ^ (temp >>> 15), temp | 1);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), temp | 61);
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
};

export const midiToFrequency = (midi: number): number => {
  return 440 * 2 ** ((midi - 69) / 12);
};

export const pickRandom = <T>(items: readonly T[], random: () => number): T => {
  return items[Math.floor(random() * items.length)];
};

export const stepDurationFromBpm = (bpm: number): number => {
  return 60 / bpm / 4;
};

