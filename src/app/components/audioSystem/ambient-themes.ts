import type { TerrainAudioKey } from './ambient-math';
import type {
  AmbientDensityRange,
  AmbientHumanRhythmId,
  AmbientIntensity,
  AmbientLayerFamily,
  AmbientLayerId
} from './ambient-presets';

export type AmbientTheme = {
  id: string;
  intensities: AmbientIntensity[];
  terrains?: TerrainAudioKey[];
  weight: number;
  allowedLayers?: AmbientLayerId[];
  blockedLayers?: AmbientLayerId[];
  anchorLayers?: AmbientLayerId[];
  density?: AmbientDensityRange;
  familyCaps?: Partial<Record<AmbientLayerFamily, number>>;
  layerWeightMultipliers?: Partial<Record<AmbientLayerId, number>>;
  lockedGeneratorVariants?: Partial<Record<AmbientLayerId, number>>;
  lockedRhythmVariants?: Partial<Record<AmbientLayerId, number>>;
  lockedAccentVariants?: Partial<Record<AmbientLayerId, number>>;
  lockedDegreeVariants?: Partial<Record<AmbientLayerId, number>>;
  lockedMirrorVariants?: Partial<Record<AmbientLayerId, number>>;
  preferredHumanRhythms?: AmbientHumanRhythmId[];
  bpmSwingScale?: number;
  timbreVariationBars?: number;
  melodyVariationBars?: number;
  rhythmVariationBars?: number;
  rhythmRotationBars?: number;
};

const THEMES: AmbientTheme[] = [
  {
    id: 'normal-hub-open-road',
    terrains: ['normal'],
    intensities: ['hub'],
    weight: 1,
    allowedLayers: ['bass', 'chord', 'guitar', 'hangpan', 'wind', 'hat', 'vocalAir'],
    blockedLayers: ['kick', 'snare', 'arp'],
    anchorLayers: ['bass'],
    density: { min: 3, max: 4 },
    layerWeightMultipliers: { guitar: 1.3, hangpan: 1.15, wind: 1.1, hat: 0.7 },
    lockedGeneratorVariants: { guitar: 1, hangpan: 0, chord: 2, bass: 0 },
    lockedRhythmVariants: { guitar: 0, hangpan: 0, chord: 1 },
    preferredHumanRhythms: ['tresillo', 'offbeat-hat'],
    bpmSwingScale: 0.35,
    timbreVariationBars: 12,
    melodyVariationBars: 24,
    rhythmVariationBars: 16,
    rhythmRotationBars: 12
  },
  {
    id: 'normal-hub-neon-plaza',
    terrains: ['normal'],
    intensities: ['hub'],
    weight: 0.9,
    allowedLayers: ['bass', 'subPiano', 'kick', 'hat', 'chord', 'lead', 'arp'],
    blockedLayers: ['wind', 'vocalOoh', 'vocalAah', 'vocalAir'],
    anchorLayers: ['bass', 'kick'],
    density: { min: 4, max: 5 },
    layerWeightMultipliers: { arp: 1.28, lead: 1.12, chord: 0.82, hat: 1.1 },
    lockedGeneratorVariants: { bass: 1, kick: 1, arp: 0, lead: 3, chord: 1 },
    lockedRhythmVariants: { kick: 1, hat: 1, arp: 0 },
    preferredHumanRhythms: ['backbeat', 'motorik'],
    bpmSwingScale: 0.18,
    timbreVariationBars: 8,
    melodyVariationBars: 16,
    rhythmVariationBars: 12,
    rhythmRotationBars: 8
  },
  {
    id: 'normal-explore-trail',
    terrains: ['normal'],
    intensities: ['explore'],
    weight: 1,
    allowedLayers: ['bass', 'chord', 'guitar', 'hangpan', 'wind', 'hat', 'vocalAir'],
    blockedLayers: ['snare'],
    anchorLayers: ['bass'],
    density: { min: 4, max: 5 },
    layerWeightMultipliers: { guitar: 1.22, hangpan: 1.12, wind: 1.1, lead: 0.7 },
    lockedGeneratorVariants: { bass: 0, guitar: 0, hangpan: 1, chord: 0, wind: 0 },
    lockedRhythmVariants: { guitar: 1, hangpan: 0, chord: 0, wind: 1 },
    preferredHumanRhythms: ['tresillo', 'clave-3-2'],
    bpmSwingScale: 0.3,
    timbreVariationBars: 12,
    melodyVariationBars: 20,
    rhythmVariationBars: 16,
    rhythmRotationBars: 12
  },
  {
    id: 'normal-explore-skyline',
    terrains: ['normal'],
    intensities: ['explore'],
    weight: 0.86,
    allowedLayers: ['bass', 'kick', 'hat', 'chord', 'lead', 'wind', 'arp'],
    blockedLayers: ['vocalOoh', 'vocalAah'],
    anchorLayers: ['bass', 'kick'],
    density: { min: 4, max: 5 },
    layerWeightMultipliers: { lead: 1.15, arp: 1.18, wind: 0.74, chord: 0.86 },
    lockedGeneratorVariants: { bass: 2, kick: 0, arp: 1, lead: 1, chord: 1 },
    lockedRhythmVariants: { kick: 0, hat: 0, lead: 4, arp: 1 },
    preferredHumanRhythms: ['offbeat-hat', 'motorik'],
    bpmSwingScale: 0.2,
    timbreVariationBars: 10,
    melodyVariationBars: 16,
    rhythmVariationBars: 12,
    rhythmRotationBars: 8
  },
  {
    id: 'fee-moon-choir',
    terrains: ['fee'],
    intensities: ['idle', 'hub'],
    weight: 1,
    allowedLayers: ['chord', 'hangpan', 'wind', 'vocalOoh', 'vocalAah', 'vocalAir'],
    blockedLayers: ['kick', 'snare', 'hat', 'arp', 'lead'],
    anchorLayers: ['hangpan'],
    density: { min: 2, max: 3 },
    layerWeightMultipliers: { vocalOoh: 1.25, vocalAah: 1.18, vocalAir: 1.12, wind: 1.08 },
    lockedGeneratorVariants: { hangpan: 2, chord: 2, vocalOoh: 0, vocalAah: 0, vocalAir: 0 },
    lockedRhythmVariants: { hangpan: 2, wind: 0, chord: 1 },
    bpmSwingScale: 0.12,
    timbreVariationBars: 16,
    melodyVariationBars: 32,
    rhythmVariationBars: 24,
    rhythmRotationBars: 16
  },
  {
    id: 'fee-crystal-waltz',
    terrains: ['fee'],
    intensities: ['hub'],
    weight: 0.82,
    allowedLayers: ['subPiano', 'chord', 'hangpan', 'hat', 'vocalAir', 'wind'],
    blockedLayers: ['kick', 'snare', 'arp'],
    anchorLayers: ['subPiano'],
    density: { min: 3, max: 4 },
    layerWeightMultipliers: { subPiano: 1.24, hangpan: 1.14, hat: 0.68, wind: 0.88 },
    lockedGeneratorVariants: { subPiano: 1, hangpan: 1, chord: 0, vocalAir: 1 },
    lockedRhythmVariants: { subPiano: 1, hangpan: 3, chord: 0 },
    preferredHumanRhythms: ['bembe', 'offbeat-hat'],
    bpmSwingScale: 0.18,
    timbreVariationBars: 14,
    melodyVariationBars: 28,
    rhythmVariationBars: 20,
    rhythmRotationBars: 14
  },
  {
    id: 'psy-mirage-archive',
    terrains: ['psy'],
    intensities: ['hub'],
    weight: 1,
    allowedLayers: ['subPiano', 'chord', 'hangpan', 'lead', 'vocalOoh', 'vocalAir', 'arp'],
    blockedLayers: ['kick', 'snare'],
    anchorLayers: ['subPiano'],
    density: { min: 3, max: 4 },
    layerWeightMultipliers: { hangpan: 1.18, vocalOoh: 1.16, arp: 0.82, lead: 0.86 },
    lockedGeneratorVariants: { subPiano: 0, hangpan: 1, chord: 2, lead: 4, vocalOoh: 1, vocalAir: 1 },
    lockedRhythmVariants: { hangpan: 1, chord: 2, lead: 0 },
    preferredHumanRhythms: ['bembe', 'clave-2-3'],
    bpmSwingScale: 0.16,
    timbreVariationBars: 14,
    melodyVariationBars: 24,
    rhythmVariationBars: 18,
    rhythmRotationBars: 12
  },
  {
    id: 'psy-signal-lattice',
    terrains: ['psy'],
    intensities: ['hub'],
    weight: 0.78,
    allowedLayers: ['bass', 'hat', 'chord', 'lead', 'arp', 'vocalAir'],
    blockedLayers: ['wind', 'snare'],
    anchorLayers: ['bass'],
    density: { min: 3, max: 4 },
    layerWeightMultipliers: { arp: 1.2, lead: 1.1, vocalAir: 0.92, chord: 0.8 },
    lockedGeneratorVariants: { bass: 2, lead: 7, arp: 1, chord: 1, vocalAir: 1 },
    lockedRhythmVariants: { hat: 1, arp: 3, lead: 5 },
    preferredHumanRhythms: ['offbeat-hat', 'clave-2-3'],
    bpmSwingScale: 0.14,
    timbreVariationBars: 10,
    melodyVariationBars: 20,
    rhythmVariationBars: 14,
    rhythmRotationBars: 10
  },
  {
    id: 'plante-canopy-step',
    terrains: ['plante'],
    intensities: ['explore'],
    weight: 1,
    allowedLayers: ['bass', 'chord', 'guitar', 'hangpan', 'wind', 'hat', 'vocalAir'],
    blockedLayers: ['snare', 'lead'],
    anchorLayers: ['bass'],
    density: { min: 4, max: 5 },
    layerWeightMultipliers: { guitar: 1.22, wind: 1.18, hangpan: 1.08, hat: 0.82 },
    lockedGeneratorVariants: { bass: 0, guitar: 1, hangpan: 0, chord: 0, wind: 0 },
    lockedRhythmVariants: { guitar: 0, hangpan: 2, wind: 0, chord: 1 },
    preferredHumanRhythms: ['tresillo', 'clave-3-2'],
    bpmSwingScale: 0.28,
    timbreVariationBars: 12,
    melodyVariationBars: 24,
    rhythmVariationBars: 16,
    rhythmRotationBars: 12
  },
  {
    id: 'plante-roots-ritual',
    terrains: ['plante'],
    intensities: ['explore'],
    weight: 0.84,
    allowedLayers: ['subPiano', 'bass', 'chord', 'wind', 'vocalOoh', 'guitar'],
    blockedLayers: ['kick', 'snare', 'arp'],
    anchorLayers: ['subPiano'],
    density: { min: 3, max: 4 },
    layerWeightMultipliers: { vocalOoh: 1.2, wind: 1.14, guitar: 0.92, bass: 0.78 },
    lockedGeneratorVariants: { subPiano: 1, chord: 2, guitar: 1, vocalOoh: 0, wind: 0 },
    lockedRhythmVariants: { subPiano: 1, chord: 2, guitar: 0 },
    preferredHumanRhythms: ['bembe', 'tresillo'],
    bpmSwingScale: 0.18,
    timbreVariationBars: 16,
    melodyVariationBars: 28,
    rhythmVariationBars: 18,
    rhythmRotationBars: 14
  },
  {
    id: 'electrique-arcade-grid',
    terrains: ['electrique'],
    intensities: ['hub'],
    weight: 1,
    allowedLayers: ['bass', 'kick', 'hat', 'chord', 'lead', 'arp'],
    blockedLayers: ['wind', 'vocalOoh', 'vocalAah', 'vocalAir'],
    anchorLayers: ['bass', 'kick'],
    density: { min: 4, max: 5 },
    layerWeightMultipliers: { arp: 1.28, hat: 1.16, lead: 1.1, chord: 0.78 },
    lockedGeneratorVariants: { bass: 1, kick: 1, arp: 1, lead: 1, chord: 1 },
    lockedRhythmVariants: { kick: 1, hat: 1, arp: 1, lead: 4 },
    preferredHumanRhythms: ['motorik', 'backbeat'],
    bpmSwingScale: 0.08,
    timbreVariationBars: 8,
    melodyVariationBars: 16,
    rhythmVariationBars: 10,
    rhythmRotationBars: 8
  },
  {
    id: 'combat-pressure-wave',
    terrains: ['combat'],
    intensities: ['battle'],
    weight: 1,
    allowedLayers: ['bass', 'subPiano', 'kick', 'snare', 'hat', 'chord', 'lead'],
    blockedLayers: ['wind', 'vocalOoh', 'vocalAah', 'vocalAir'],
    anchorLayers: ['bass', 'kick'],
    density: { min: 5, max: 6 },
    layerWeightMultipliers: { bass: 1.2, kick: 1.18, snare: 1.08, arp: 0.5 },
    lockedGeneratorVariants: { bass: 0, subPiano: 0, kick: 2, snare: 0, lead: 3, chord: 1 },
    lockedRhythmVariants: { kick: 0, snare: 0, hat: 0, lead: 4 },
    preferredHumanRhythms: ['backbeat', 'dembow'],
    bpmSwingScale: 0.04,
    timbreVariationBars: 8,
    melodyVariationBars: 16,
    rhythmVariationBars: 10,
    rhythmRotationBars: 8
  },
  {
    id: 'combat-pursuit-grid',
    terrains: ['combat'],
    intensities: ['battle'],
    weight: 0.92,
    allowedLayers: ['bass', 'kick', 'hat', 'chord', 'lead', 'arp'],
    blockedLayers: ['wind', 'vocalOoh', 'vocalAah', 'vocalAir'],
    anchorLayers: ['bass', 'kick'],
    density: { min: 4, max: 5 },
    layerWeightMultipliers: { arp: 1.32, hat: 1.14, lead: 1.08, chord: 0.76 },
    lockedGeneratorVariants: { bass: 1, kick: 1, hat: 0, lead: 7, arp: 1, chord: 1 },
    lockedRhythmVariants: { kick: 1, hat: 1, arp: 3, lead: 5 },
    preferredHumanRhythms: ['motorik', 'dembow'],
    bpmSwingScale: 0.03,
    timbreVariationBars: 8,
    melodyVariationBars: 16,
    rhythmVariationBars: 8,
    rhythmRotationBars: 6
  },
  {
    id: 'combat-duel-chamber',
    terrains: ['combat'],
    intensities: ['battle'],
    weight: 0.84,
    allowedLayers: ['subPiano', 'bass', 'kick', 'snare', 'chord', 'lead'],
    blockedLayers: ['hat', 'arp', 'wind', 'vocalOoh', 'vocalAah', 'vocalAir'],
    anchorLayers: ['subPiano', 'kick'],
    density: { min: 4, max: 5 },
    layerWeightMultipliers: { subPiano: 1.18, snare: 1.12, lead: 0.92, bass: 0.82 },
    lockedGeneratorVariants: { subPiano: 2, bass: 2, kick: 0, snare: 0, chord: 2, lead: 5 },
    lockedRhythmVariants: { kick: 0, snare: 1, chord: 2, lead: 4 },
    preferredHumanRhythms: ['backbeat'],
    bpmSwingScale: 0.02,
    timbreVariationBars: 10,
    melodyVariationBars: 18,
    rhythmVariationBars: 10,
    rhythmRotationBars: 8
  },
  {
    id: 'generic-hub-soft-focus',
    intensities: ['hub'],
    weight: 0.6,
    allowedLayers: ['subPiano', 'chord', 'hangpan', 'wind', 'guitar', 'vocalAir'],
    blockedLayers: ['snare'],
    anchorLayers: ['subPiano'],
    density: { min: 3, max: 4 },
    layerWeightMultipliers: { hangpan: 1.08, wind: 1.08, guitar: 0.96 },
    lockedGeneratorVariants: { subPiano: 0, chord: 0, hangpan: 1, guitar: 0, vocalAir: 1 },
    lockedRhythmVariants: { subPiano: 0, chord: 1, hangpan: 0 },
    preferredHumanRhythms: ['offbeat-hat', 'bembe'],
    bpmSwingScale: 0.22,
    timbreVariationBars: 12,
    melodyVariationBars: 24,
    rhythmVariationBars: 16,
    rhythmRotationBars: 12
  },
  {
    id: 'generic-explore-drift',
    intensities: ['explore'],
    weight: 0.6,
    allowedLayers: ['bass', 'chord', 'hangpan', 'wind', 'hat', 'guitar'],
    blockedLayers: ['snare'],
    anchorLayers: ['bass'],
    density: { min: 4, max: 5 },
    layerWeightMultipliers: { hangpan: 1.08, wind: 1.06, guitar: 0.96, hat: 0.82 },
    lockedGeneratorVariants: { bass: 0, chord: 0, hangpan: 1, guitar: 0, wind: 0 },
    lockedRhythmVariants: { chord: 0, hangpan: 0, guitar: 0, hat: 0 },
    preferredHumanRhythms: ['tresillo', 'offbeat-hat'],
    bpmSwingScale: 0.24,
    timbreVariationBars: 12,
    melodyVariationBars: 24,
    rhythmVariationBars: 16,
    rhythmRotationBars: 12
  },
  {
    id: 'generic-battle-raid',
    intensities: ['battle'],
    weight: 0.6,
    allowedLayers: ['bass', 'kick', 'snare', 'hat', 'chord', 'lead', 'arp'],
    anchorLayers: ['bass', 'kick'],
    density: { min: 5, max: 6 },
    layerWeightMultipliers: { bass: 1.1, kick: 1.1, arp: 1.04 },
    lockedGeneratorVariants: { bass: 0, kick: 1, snare: 0, lead: 1, arp: 0, chord: 1 },
    lockedRhythmVariants: { kick: 1, snare: 0, hat: 0, arp: 1 },
    preferredHumanRhythms: ['backbeat', 'motorik'],
    bpmSwingScale: 0.04,
    timbreVariationBars: 8,
    melodyVariationBars: 16,
    rhythmVariationBars: 10,
    rhythmRotationBars: 8
  }
];

const matchesTheme = (
  theme: AmbientTheme,
  terrainKey: TerrainAudioKey,
  intensity: AmbientIntensity
): boolean => {
  return theme.intensities.includes(intensity)
    && (!theme.terrains?.length || theme.terrains.includes(terrainKey));
};

export const getAmbientThemesForContext = (
  terrainKey: TerrainAudioKey,
  intensity: AmbientIntensity
): AmbientTheme[] => {
  const terrainMatches = THEMES.filter((theme) => matchesTheme(theme, terrainKey, intensity) && theme.terrains?.length);
  if (terrainMatches.length > 0) {
    return terrainMatches;
  }

  return THEMES.filter((theme) => matchesTheme(theme, terrainKey, intensity) && !theme.terrains?.length);
};

export const selectAmbientTheme = (
  terrainKey: TerrainAudioKey,
  intensity: AmbientIntensity,
  random: () => number
): AmbientTheme | null => {
  const candidates = getAmbientThemesForContext(terrainKey, intensity);
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, theme) => sum + Math.max(theme.weight, 0.01), 0);
  let cursor = random() * totalWeight;

  for (const theme of candidates) {
    cursor -= Math.max(theme.weight, 0.01);
    if (cursor <= 0) {
      return theme;
    }
  }

  return candidates[candidates.length - 1];
};
