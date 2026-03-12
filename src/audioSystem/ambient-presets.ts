import { normalizeTerrainKey, type TerrainAudioKey } from './ambient-math';

export type AmbientIntensity = 'idle' | 'hub' | 'explore' | 'battle';
export type AmbientPhase = 'A' | 'B' | 'C' | 'break';
export type AmbientVoice = 'square' | 'triangle' | 'noise';
export type AmbientLayerFamily = 'rhythm' | 'low' | 'harmony' | 'melody' | 'texture';
export type AmbientLayerId =
  | 'bass'
  | 'subPiano'
  | 'kick'
  | 'snare'
  | 'hat'
  | 'chord'
  | 'lead'
  | 'guitar'
  | 'wind'
  | 'hangpan'
  | 'arp'
  | 'vocalOoh'
  | 'vocalAah'
  | 'vocalAir';
export type AmbientHumanRhythmId =
  | 'tresillo'
  | 'dembow'
  | 'clave-3-2'
  | 'clave-2-3'
  | 'backbeat'
  | 'offbeat-hat'
  | 'one-drop'
  | 'motorik'
  | 'bembe';
export type AmbientNoteMode =
  | 'root'
  | 'bass'
  | 'walk'
  | 'accent'
  | 'chord'
  | 'guitar'
  | 'hangpan'
  | 'arp'
  | 'subPiano'
  | 'vocal';

export type AmbientPatternVariant = {
  steps?: number;
  pulses?: number;
  rotation?: number;
  probability?: number;
  durationSteps?: number;
  filterHz?: number;
  octaveOffset?: number;
};

export type AmbientAccentVariant = number[];
export type AmbientMirrorMode = 'none' | 'full' | 'center-gap' | 'center-repeat';

export type AmbientGeneratorVariant = {
  voice?: AmbientVoice;
  partials?: number[];
  overlayVoice?: AmbientVoice;
  overlayPartials?: number[];
  overlayGain?: number;
  gainScale?: number;
  attackScale?: number;
  durationScale?: number;
  filterOffset?: number;
  pitchStartMultiplier?: number;
  pitchEndMultiplier?: number;
};

export type AmbientLayerPreset = {
  id: AmbientLayerId;
  family: AmbientLayerFamily;
  voice: AmbientVoice;
  steps: number;
  pulses: number;
  rotation: number;
  probability: number;
  gain: number;
  durationSteps: number;
  phases: AmbientPhase[];
  intensities: AmbientIntensity[];
  weight: number;
  exclusiveGroup?: string;
  octaveOffset?: number;
  noteMode?: AmbientNoteMode;
  filterHz?: number;
  rhythmVariants?: AmbientPatternVariant[];
  accentVariants?: AmbientAccentVariant[];
  mirrorVariants?: AmbientMirrorMode[];
  degreeVariants?: number[][];
  generatorVariants?: AmbientGeneratorVariant[];
  humanRhythmIds?: AmbientHumanRhythmId[];
};

export type AmbientDensityRange = {
  min: number;
  max: number;
};

export type AmbientPreset = {
  bpm: Record<AmbientIntensity, number>;
  density: Record<AmbientIntensity, AmbientDensityRange>;
  rootMidi: number;
  scaleIntervals: number[];
  layers: AmbientLayerPreset[];
};

type LayerTweaks = Partial<Record<AmbientLayerId, Partial<AmbientLayerPreset>>>;
type DensityTweaks = Partial<Record<AmbientIntensity, AmbientDensityRange>>;
type PresetOptions = {
  density?: DensityTweaks;
  layerTweaks?: LayerTweaks;
};

const BASE_DENSITY: Record<AmbientIntensity, AmbientDensityRange> = {
  idle: { min: 2, max: 3 },
  hub: { min: 3, max: 4 },
  explore: { min: 4, max: 5 },
  battle: { min: 5, max: 6 }
};

const BASE_LAYERS: AmbientLayerPreset[] = [
  {
    id: 'wind',
    family: 'texture',
    voice: 'noise',
    steps: 16,
    pulses: 3,
    rotation: 1,
    probability: 0.24,
    gain: 0.013,
    durationSteps: 6,
    phases: ['A', 'B', 'break'],
    intensities: ['idle', 'hub', 'explore'],
    weight: 0.4,
    exclusiveGroup: 'texture-main',
    filterHz: 780
  },
  {
    id: 'chord',
    family: 'harmony',
    voice: 'square',
    steps: 16,
    pulses: 4,
    rotation: 0,
    probability: 0.86,
    gain: 0.032,
    durationSteps: 4,
    phases: ['A', 'B', 'C', 'break'],
    intensities: ['idle', 'hub', 'explore', 'battle'],
    weight: 1.1,
    exclusiveGroup: 'harmony-main',
    noteMode: 'chord',
    filterHz: 1500,
    humanRhythmIds: ['tresillo', 'clave-3-2', 'clave-2-3', 'offbeat-hat', 'bembe']
  },
  {
    id: 'bass',
    family: 'low',
    voice: 'triangle',
    steps: 16,
    pulses: 6,
    rotation: 0,
    probability: 0.95,
    gain: 0.112,
    durationSteps: 1,
    phases: ['A', 'B', 'C', 'break'],
    intensities: ['hub', 'explore', 'battle'],
    weight: 1.62,
    noteMode: 'bass',
    octaveOffset: -1,
    filterHz: 720,
    humanRhythmIds: ['tresillo', 'dembow', 'one-drop', 'motorik']
  },
  {
    id: 'subPiano',
    family: 'low',
    voice: 'triangle',
    steps: 16,
    pulses: 2,
    rotation: 8,
    probability: 0.42,
    gain: 0.058,
    durationSteps: 4,
    phases: ['A', 'C', 'break'],
    intensities: ['hub', 'explore', 'battle'],
    weight: 0.44,
    noteMode: 'subPiano',
    octaveOffset: -2,
    filterHz: 320
  },
  {
    id: 'kick',
    family: 'rhythm',
    voice: 'triangle',
    steps: 16,
    pulses: 5,
    rotation: 0,
    probability: 0.97,
    gain: 0.115,
    durationSteps: 1,
    phases: ['A', 'B', 'C'],
    intensities: ['hub', 'explore', 'battle'],
    weight: 1.6,
    filterHz: 240,
    humanRhythmIds: ['tresillo', 'dembow', 'backbeat', 'motorik', 'one-drop']
  },
  {
    id: 'snare',
    family: 'rhythm',
    voice: 'noise',
    steps: 16,
    pulses: 2,
    rotation: 4,
    probability: 0.42,
    gain: 0.028,
    durationSteps: 1,
    phases: ['B', 'C', 'break'],
    intensities: ['explore', 'battle'],
    weight: 0.68,
    exclusiveGroup: 'snare-family',
    filterHz: 1800,
    humanRhythmIds: ['dembow', 'backbeat', 'one-drop']
  },
  {
    id: 'hat',
    family: 'rhythm',
    voice: 'noise',
    steps: 16,
    pulses: 7,
    rotation: 2,
    probability: 0.34,
    gain: 0.012,
    durationSteps: 1,
    phases: ['B', 'C', 'break'],
    intensities: ['hub', 'explore', 'battle'],
    weight: 0.66,
    filterHz: 5200,
    humanRhythmIds: ['clave-3-2', 'clave-2-3', 'offbeat-hat', 'motorik', 'dembow', 'bembe']
  },
  {
    id: 'guitar',
    family: 'melody',
    voice: 'square',
    steps: 8,
    pulses: 3,
    rotation: 2,
    probability: 0.72,
    gain: 0.026,
    durationSteps: 2,
    phases: ['B', 'C'],
    intensities: ['hub', 'explore'],
    weight: 1.0,
    exclusiveGroup: 'melody-main',
    noteMode: 'guitar',
    octaveOffset: 1,
    filterHz: 1650,
    humanRhythmIds: ['tresillo', 'clave-3-2', 'clave-2-3', 'offbeat-hat']
  },
  {
    id: 'lead',
    family: 'melody',
    voice: 'square',
    steps: 15,
    pulses: 4,
    rotation: 2,
    probability: 0.74,
    gain: 0.054,
    durationSteps: 2,
    phases: ['C'],
    intensities: ['hub', 'explore', 'battle'],
    weight: 1.15,
    exclusiveGroup: 'melody-main',
    noteMode: 'walk',
    octaveOffset: 1,
    filterHz: 1850
  },
  {
    id: 'hangpan',
    family: 'melody',
    voice: 'triangle',
    steps: 16,
    pulses: 3,
    rotation: 6,
    probability: 0.7,
    gain: 0.034,
    durationSteps: 3,
    phases: ['A', 'C', 'break'],
    intensities: ['idle', 'hub', 'explore'],
    weight: 1.08,
    exclusiveGroup: 'melody-main',
    noteMode: 'hangpan',
    octaveOffset: 1,
    filterHz: 1320,
    humanRhythmIds: ['bembe']
  },
  {
    id: 'arp',
    family: 'harmony',
    voice: 'square',
    steps: 16,
    pulses: 6,
    rotation: 3,
    probability: 0.8,
    gain: 0.022,
    durationSteps: 1,
    phases: ['C'],
    intensities: ['explore', 'battle'],
    weight: 0.98,
    exclusiveGroup: 'harmony-main',
    noteMode: 'arp',
    octaveOffset: 1,
    filterHz: 2100,
    humanRhythmIds: ['clave-3-2', 'clave-2-3', 'offbeat-hat', 'bembe']
  },
  {
    id: 'vocalOoh',
    family: 'harmony',
    voice: 'triangle',
    steps: 16,
    pulses: 1,
    rotation: 12,
    probability: 0.24,
    gain: 0.024,
    durationSteps: 8,
    phases: ['A', 'C', 'break'],
    intensities: ['idle', 'hub', 'explore'],
    weight: 0.28,
    exclusiveGroup: 'vocal-main',
    noteMode: 'vocal',
    octaveOffset: 0,
    filterHz: 780
  },
  {
    id: 'vocalAah',
    family: 'harmony',
    voice: 'triangle',
    steps: 16,
    pulses: 1,
    rotation: 4,
    probability: 0.2,
    gain: 0.022,
    durationSteps: 8,
    phases: ['A', 'C'],
    intensities: ['idle', 'hub', 'explore'],
    weight: 0.24,
    exclusiveGroup: 'vocal-main',
    noteMode: 'vocal',
    octaveOffset: 1,
    filterHz: 980
  },
  {
    id: 'vocalAir',
    family: 'harmony',
    voice: 'triangle',
    steps: 16,
    pulses: 1,
    rotation: 8,
    probability: 0.16,
    gain: 0.02,
    durationSteps: 10,
    phases: ['break', 'C'],
    intensities: ['idle', 'hub', 'explore'],
    weight: 0.22,
    exclusiveGroup: 'vocal-main',
    noteMode: 'vocal',
    octaveOffset: 1,
    filterHz: 1280
  }
];

const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MINOR_PENTATONIC = [0, 3, 5, 7, 10];
const MAJOR_PENTATONIC = [0, 2, 4, 7, 9];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];
const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10];

const clampProbability = (value: number): number => Math.min(1, Math.max(0.02, value));

const BASE_LAYER_VARIANTS: Partial<Record<AmbientLayerId, Pick<AmbientLayerPreset, 'rhythmVariants' | 'accentVariants' | 'mirrorVariants' | 'degreeVariants' | 'generatorVariants'>>> = {
  wind: {
    mirrorVariants: ['none', 'center-gap', 'full'],
    rhythmVariants: [
      { steps: 16, pulses: 2, rotation: 3, probability: 0.18, durationSteps: 6, filterHz: 720 },
      { steps: 15, pulses: 1, rotation: 7, probability: 0.12, durationSteps: 8, filterHz: 660 },
      { steps: 17, pulses: 2, rotation: 9, probability: 0.16, durationSteps: 7, filterHz: 840 }
    ]
  },
  bass: {
    rhythmVariants: [
      { steps: 16, pulses: 6, rotation: 0, probability: 0.96, durationSteps: 1 },
      { steps: 16, pulses: 7, rotation: 1, probability: 0.92, durationSteps: 1 },
      { steps: 15, pulses: 5, rotation: 3, probability: 0.9, durationSteps: 1 },
      { steps: 17, pulses: 7, rotation: 5, probability: 0.88, durationSteps: 1 }
    ],
    accentVariants: [
      [1.18, 0.84, 0.96, 0.82, 1.08, 0.86, 0.98, 0.8],
      [1.14, 0.88, 1.02, 0.78, 1.1, 0.82, 0.94, 0.86],
      [1.2, 0.8, 0.92, 0.88, 1.04, 0.84, 1.0, 0.76]
    ],
    degreeVariants: [
      [0, 0, 4, 0, 3, 0, 4, 0],
      [0, 2, 4, 2, 3, 2, 4, 1],
      [0, 0, 3, 0, 4, 0, 1, 0],
      [0, 5, 4, 3, 0, 4, 2, 1]
    ],
    generatorVariants: [
      {
        voice: 'triangle',
        partials: [1, 2.01],
        overlayVoice: 'square',
        overlayPartials: [3.01],
        overlayGain: 0.06,
        gainScale: 1.12,
        filterOffset: -80
      },
      {
        voice: 'square',
        partials: [1, 2],
        overlayVoice: 'triangle',
        overlayPartials: [3.01],
        overlayGain: 0.06,
        attackScale: 0.78,
        durationScale: 0.92,
        filterOffset: 40
      },
      {
        voice: 'triangle',
        partials: [1, 1.5, 2.01],
        overlayVoice: 'square',
        overlayPartials: [4.02],
        overlayGain: 0.05,
        gainScale: 1.08,
        durationScale: 1.08,
        filterOffset: 80
      }
    ]
  },
  subPiano: {
    rhythmVariants: [
      { steps: 16, pulses: 2, rotation: 8, probability: 0.42, durationSteps: 4 },
      { steps: 16, pulses: 1, rotation: 12, probability: 0.34, durationSteps: 6 },
      { steps: 15, pulses: 2, rotation: 5, probability: 0.38, durationSteps: 4 },
      { steps: 17, pulses: 2, rotation: 9, probability: 0.3, durationSteps: 5 }
    ],
    degreeVariants: [
      [0, 0, 3, 0, 4, 0, 2, 0],
      [0, 0, 5, 0, 3, 0, 4, 0],
      [0, 0, 4, 0, 1, 0, 5, 0]
    ],
    generatorVariants: [
      {
        voice: 'triangle',
        partials: [1, 2],
        overlayVoice: 'square',
        overlayPartials: [3.01],
        overlayGain: 0.08,
        gainScale: 1.04,
        filterOffset: -30
      },
      {
        voice: 'triangle',
        partials: [1, 2.01, 4.02],
        overlayVoice: 'square',
        overlayPartials: [3.01],
        overlayGain: 0.05,
        durationScale: 1.18,
        filterOffset: -70
      },
      {
        voice: 'square',
        partials: [1, 2],
        overlayVoice: 'triangle',
        overlayPartials: [4.02],
        overlayGain: 0.04,
        attackScale: 0.86,
        durationScale: 0.92,
        filterOffset: 60
      }
    ]
  },
  kick: {
    rhythmVariants: [
      { steps: 16, pulses: 5, rotation: 0, probability: 0.97 },
      { steps: 16, pulses: 6, rotation: 1, probability: 0.94 },
      { steps: 15, pulses: 5, rotation: 2, probability: 0.92 },
      { steps: 17, pulses: 6, rotation: 4, probability: 0.9 }
    ],
    accentVariants: [
      [1.28, 0.74, 0.9, 0.78, 1.12, 0.72, 0.88, 0.76, 1.24, 0.74, 0.94, 0.8, 1.1, 0.72, 0.9, 0.78],
      [1.2, 0.82, 0.86, 0.74, 1.04, 0.78, 0.82, 0.72, 1.3, 0.8, 0.9, 0.74, 1.06, 0.8, 0.86, 0.72],
      [1.24, 0.76, 0.92, 0.7, 1.1, 0.82, 0.84, 0.72, 1.22, 0.78, 0.96, 0.74, 1.08, 0.8, 0.9, 0.72]
    ],
    generatorVariants: [
      { gainScale: 1.08, pitchStartMultiplier: 1.02, pitchEndMultiplier: 0.98 },
      {
        gainScale: 1.18,
        attackScale: 0.78,
        durationScale: 0.92,
        filterOffset: 18,
        pitchStartMultiplier: 1.2,
        pitchEndMultiplier: 0.88
      },
      {
        gainScale: 1.26,
        durationScale: 1.08,
        filterOffset: -18,
        pitchStartMultiplier: 0.98,
        pitchEndMultiplier: 0.74
      }
    ]
  },
  snare: {
    rhythmVariants: [
      { steps: 16, pulses: 2, rotation: 4, probability: 0.38 },
      { steps: 16, pulses: 3, rotation: 6, probability: 0.3 },
      { steps: 15, pulses: 2, rotation: 7, probability: 0.28 },
      { steps: 17, pulses: 3, rotation: 8, probability: 0.24 }
    ],
    accentVariants: [
      [0.78, 0.62, 1.18, 0.66, 0.82, 0.6, 1.08, 0.68],
      [0.82, 0.58, 1.12, 0.64, 0.88, 0.62, 1.2, 0.66],
      [0.8, 0.6, 1.1, 0.7, 0.84, 0.58, 1.14, 0.68]
    ]
  },
  hat: {
    rhythmVariants: [
      { steps: 16, pulses: 7, rotation: 2, probability: 0.34 },
      { steps: 16, pulses: 9, rotation: 1, probability: 0.3 },
      { steps: 15, pulses: 6, rotation: 4, probability: 0.32 },
      { steps: 17, pulses: 8, rotation: 5, probability: 0.26 }
    ],
    accentVariants: [
      [1.0, 0.58, 0.76, 0.5, 0.94, 0.6, 0.82, 0.54, 1.02, 0.58, 0.78, 0.5, 0.9, 0.62, 0.8, 0.56],
      [0.96, 0.6, 0.82, 0.52, 1.04, 0.58, 0.8, 0.54, 0.98, 0.62, 0.84, 0.5, 0.92, 0.64, 0.78, 0.56],
      [1.02, 0.56, 0.8, 0.48, 0.92, 0.62, 0.86, 0.52, 1.0, 0.58, 0.82, 0.5, 0.94, 0.6, 0.76, 0.54]
    ]
  },
  chord: {
    mirrorVariants: ['none', 'full', 'center-repeat'],
    rhythmVariants: [
      { steps: 16, pulses: 4, rotation: 0, probability: 0.86, durationSteps: 4 },
      { steps: 16, pulses: 3, rotation: 2, probability: 0.8, durationSteps: 5 },
      { steps: 15, pulses: 5, rotation: 1, probability: 0.78, durationSteps: 3 },
      { steps: 17, pulses: 4, rotation: 6, probability: 0.74, durationSteps: 4 }
    ],
    accentVariants: [
      [1.12, 0.82, 0.92, 0.86],
      [1.08, 0.88, 0.96, 0.8],
      [1.16, 0.8, 0.9, 0.88]
    ],
    degreeVariants: [
      [0, 4, 5, 3],
      [0, 2, 5, 4],
      [0, 3, 4, 1],
      [0, 5, 3, 4]
    ],
    generatorVariants: [
      {
        voice: 'square',
        overlayVoice: 'triangle',
        overlayPartials: [2.01],
        overlayGain: 0.1,
        attackScale: 1.12,
        durationScale: 1.08,
        filterOffset: -120
      },
      {
        voice: 'square',
        partials: [1, 2.01],
        overlayVoice: 'square',
        overlayPartials: [4.02],
        overlayGain: 0.04,
        durationScale: 1.16,
        filterOffset: 140
      },
      {
        voice: 'triangle',
        overlayVoice: 'square',
        overlayPartials: [2.01],
        overlayGain: 0.14,
        attackScale: 1.36,
        durationScale: 1.22,
        filterOffset: -40
      }
    ]
  },
  lead: {
    mirrorVariants: ['none', 'center-gap', 'full', 'center-repeat'],
    rhythmVariants: [
      { steps: 15, pulses: 4, rotation: 2, probability: 0.74, durationSteps: 2 },
      { steps: 16, pulses: 5, rotation: 5, probability: 0.68, durationSteps: 2 },
      { steps: 17, pulses: 3, rotation: 7, probability: 0.78, durationSteps: 3 },
      { steps: 12, pulses: 4, rotation: 3, probability: 0.72, durationSteps: 2 },
      { steps: 16, pulses: 4, rotation: 0, probability: 0.76, durationSteps: 2 },
      { steps: 16, pulses: 6, rotation: 3, probability: 0.66, durationSteps: 1 },
      { steps: 15, pulses: 5, rotation: 6, probability: 0.7, durationSteps: 2 },
      { steps: 18, pulses: 5, rotation: 4, probability: 0.68, durationSteps: 2 },
      { steps: 14, pulses: 4, rotation: 5, probability: 0.74, durationSteps: 3 },
      { steps: 17, pulses: 4, rotation: 1, probability: 0.8, durationSteps: 2 }
    ],
    accentVariants: [
      [1.14, 0.82, 0.96, 0.78, 1.06, 0.84, 0.92, 0.8],
      [1.1, 0.88, 0.94, 0.76, 1.12, 0.82, 0.98, 0.78],
      [1.16, 0.8, 1.0, 0.74, 1.04, 0.86, 0.9, 0.82]
    ],
    degreeVariants: [
      [0, 2, 4, 5, 4, 2, 1, 3],
      [0, 3, 4, 2, 5, 4, 2, 1],
      [0, 2, 5, 4, 1, 3, 4, 2],
      [0, 4, 3, 5, 2, 1, 4, 2],
      [0, 1, 3, 4, 2, 5, 4, 2],
      [0, 4, 5, 3, 2, 1, 3, 5],
      [0, 2, 1, 4, 5, 3, 2, 4],
      [0, 5, 4, 2, 3, 1, 4, 2],
      [0, 3, 1, 4, 2, 5, 3, 4],
      [0, 2, 4, 1, 5, 3, 4, 1]
    ],
    generatorVariants: [
      {
        voice: 'square',
        overlayVoice: 'triangle',
        overlayPartials: [2.01],
        overlayGain: 0.12,
        gainScale: 1.02,
        filterOffset: 200
      },
      {
        voice: 'square',
        partials: [1, 2.01, 4.02],
        overlayVoice: 'square',
        overlayPartials: [3.01],
        overlayGain: 0.05,
        attackScale: 0.56,
        durationScale: 0.8,
        filterOffset: 260
      },
      {
        voice: 'square',
        partials: [1, 2.01],
        overlayVoice: 'triangle',
        overlayPartials: [2.01],
        overlayGain: 0.08,
        attackScale: 0.66,
        durationScale: 0.88,
        filterOffset: 90
      },
      {
        voice: 'square',
        partials: [1, 2.01],
        overlayVoice: 'square',
        overlayPartials: [4.02],
        overlayGain: 0.05,
        gainScale: 1.04,
        durationScale: 1.08,
        filterOffset: 180
      },
      {
        voice: 'triangle',
        partials: [1, 2.01],
        overlayVoice: 'triangle',
        overlayPartials: [3.01],
        overlayGain: 0.05,
        gainScale: 0.88,
        durationScale: 1.24,
        filterOffset: -120
      },
      {
        voice: 'triangle',
        overlayVoice: 'square',
        overlayPartials: [2.01],
        overlayGain: 0.15,
        gainScale: 0.92,
        durationScale: 1.16,
        filterOffset: 10
      },
      {
        voice: 'square',
        partials: [1, 2.01],
        overlayVoice: 'triangle',
        overlayPartials: [3.01, 4.02],
        overlayGain: 0.07,
        gainScale: 0.98,
        durationScale: 1.12,
        filterOffset: 70
      },
      {
        voice: 'square',
        partials: [1, 3.01],
        overlayVoice: 'square',
        overlayPartials: [2.01],
        overlayGain: 0.06,
        attackScale: 0.58,
        durationScale: 0.74,
        filterOffset: 300
      },
      {
        voice: 'triangle',
        partials: [1, 2.01],
        overlayVoice: 'triangle',
        overlayPartials: [4.02],
        overlayGain: 0.04,
        gainScale: 0.94,
        durationScale: 1.02,
        filterOffset: -30
      }
    ]
  },
  guitar: {
    mirrorVariants: ['none', 'full', 'center-gap'],
    rhythmVariants: [
      { steps: 8, pulses: 3, rotation: 2, probability: 0.72, durationSteps: 2 },
      { steps: 12, pulses: 4, rotation: 1, probability: 0.68, durationSteps: 2 },
      { steps: 15, pulses: 5, rotation: 4, probability: 0.66, durationSteps: 1 },
      { steps: 16, pulses: 4, rotation: 6, probability: 0.64, durationSteps: 2 }
    ],
    accentVariants: [
      [1.18, 0.72, 0.92, 0.84, 1.04, 0.76, 0.96, 0.82],
      [1.12, 0.78, 0.98, 0.8, 1.08, 0.74, 0.9, 0.86],
      [1.16, 0.7, 0.94, 0.86, 1.02, 0.8, 1.0, 0.78]
    ],
    degreeVariants: [
      [0, 2, 4, 2, 1, 3, 4, 2],
      [0, 4, 2, 5, 3, 1, 4, 2],
      [0, 3, 5, 2, 4, 1, 3, 2],
      [0, 2, 1, 4, 5, 3, 2, 4]
    ],
    generatorVariants: [
      {
        voice: 'square',
        overlayVoice: 'triangle',
        overlayPartials: [2.01],
        overlayGain: 0.08,
        attackScale: 0.62,
        durationScale: 0.84,
        filterOffset: 40
      },
      {
        voice: 'triangle',
        overlayVoice: 'square',
        overlayPartials: [2.01],
        overlayGain: 0.06,
        durationScale: 1.02,
        filterOffset: -60
      },
      {
        voice: 'square',
        partials: [1, 2.01],
        overlayVoice: 'square',
        overlayPartials: [3.01],
        overlayGain: 0.05,
        attackScale: 0.7,
        filterOffset: 140
      }
    ]
  },
  hangpan: {
    mirrorVariants: ['none', 'full', 'center-repeat'],
    rhythmVariants: [
      { steps: 16, pulses: 3, rotation: 6, probability: 0.7, durationSteps: 3 },
      { steps: 15, pulses: 4, rotation: 5, probability: 0.68, durationSteps: 3 },
      { steps: 17, pulses: 3, rotation: 8, probability: 0.66, durationSteps: 4 },
      { steps: 12, pulses: 3, rotation: 1, probability: 0.72, durationSteps: 2 }
    ],
    accentVariants: [
      [1.08, 0.88, 0.96, 0.84, 1.02, 0.9, 0.94, 0.86],
      [1.12, 0.84, 0.92, 0.88, 1.0, 0.86, 0.98, 0.82]
    ],
    degreeVariants: [
      [0, 2, 4, 1, 3, 2, 4, 1],
      [0, 3, 5, 2, 4, 1, 3, 2],
      [0, 2, 5, 3, 4, 2, 1, 4],
      [0, 4, 2, 5, 3, 1, 4, 2]
    ],
    generatorVariants: [
      {
        voice: 'triangle',
        partials: [1, 2.01],
        overlayVoice: 'triangle',
        overlayPartials: [3.01],
        overlayGain: 0.05,
        durationScale: 1.08
      },
      {
        voice: 'triangle',
        partials: [1, 1.5, 2.01],
        overlayVoice: 'square',
        overlayPartials: [4.02],
        overlayGain: 0.04,
        gainScale: 0.96,
        filterOffset: -40
      },
      {
        voice: 'triangle',
        partials: [1, 2.01],
        overlayVoice: 'square',
        overlayPartials: [3.01],
        overlayGain: 0.06,
        durationScale: 1.14,
        filterOffset: 120
      }
    ]
  },
  arp: {
    mirrorVariants: ['none', 'center-gap', 'full'],
    rhythmVariants: [
      { steps: 16, pulses: 6, rotation: 3, probability: 0.8, durationSteps: 1 },
      { steps: 15, pulses: 5, rotation: 2, probability: 0.82, durationSteps: 1 },
      { steps: 17, pulses: 7, rotation: 4, probability: 0.76, durationSteps: 1 },
      { steps: 12, pulses: 5, rotation: 1, probability: 0.78, durationSteps: 1 }
    ],
    accentVariants: [
      [1.04, 0.76, 0.94, 0.72, 1.0, 0.8, 0.92, 0.74],
      [1.08, 0.72, 0.9, 0.78, 0.98, 0.76, 0.96, 0.7]
    ],
    degreeVariants: [
      [0, 2, 4, 2, 1, 3, 4, 2],
      [0, 4, 2, 5, 3, 1, 4, 2],
      [0, 3, 5, 2, 4, 1, 3, 2],
      [0, 2, 5, 4, 1, 3, 4, 2]
    ],
    generatorVariants: [
      {
        voice: 'square',
        overlayVoice: 'triangle',
        overlayPartials: [2.01],
        overlayGain: 0.08,
        filterOffset: 120
      },
      {
        voice: 'triangle',
        overlayVoice: 'square',
        overlayPartials: [2.01],
        overlayGain: 0.1,
        gainScale: 0.92,
        durationScale: 1.08,
        filterOffset: 220
      },
      {
        voice: 'square',
        partials: [1, 2.01],
        overlayVoice: 'square',
        overlayPartials: [4.02],
        overlayGain: 0.04,
        attackScale: 0.82,
        filterOffset: -40
      }
    ]
  },
  vocalOoh: {
    mirrorVariants: ['none', 'full'],
    degreeVariants: [
      [0, 2, 4, 3],
      [0, 4, 2, 5],
      [0, 3, 5, 2]
    ],
    generatorVariants: [
      {
        voice: 'triangle',
        overlayVoice: 'triangle',
        overlayPartials: [2.01],
        overlayGain: 0.34,
        durationScale: 1.12,
        filterOffset: -60
      },
      {
        voice: 'triangle',
        overlayVoice: 'square',
        overlayPartials: [2.01],
        overlayGain: 0.18,
        filterOffset: 80
      }
    ]
  },
  vocalAah: {
    mirrorVariants: ['none', 'center-repeat'],
    degreeVariants: [
      [0, 4, 2, 5],
      [0, 3, 5, 2],
      [0, 2, 4, 3]
    ],
    generatorVariants: [
      {
        voice: 'triangle',
        overlayVoice: 'triangle',
        overlayPartials: [2.01],
        overlayGain: 0.28,
        durationScale: 1.08,
        filterOffset: -20
      },
      {
        voice: 'triangle',
        overlayVoice: 'square',
        overlayPartials: [2.01],
        overlayGain: 0.2,
        filterOffset: 120
      }
    ]
  },
  vocalAir: {
    mirrorVariants: ['none', 'center-gap'],
    degreeVariants: [
      [0, 5, 3, 4],
      [0, 2, 5, 4],
      [0, 4, 3, 1]
    ],
    generatorVariants: [
      {
        voice: 'triangle',
        overlayVoice: 'triangle',
        overlayPartials: [2.01],
        overlayGain: 0.26,
        durationScale: 1.18,
        filterOffset: -40
      },
      {
        voice: 'triangle',
        overlayVoice: 'square',
        overlayPartials: [2.01],
        overlayGain: 0.14,
        filterOffset: 160
      }
    ]
  }
};

const enrichBaseLayer = (layer: AmbientLayerPreset): AmbientLayerPreset => {
  const variants = BASE_LAYER_VARIANTS[layer.id];
  if (!variants) return { ...layer };
  return {
    ...layer,
    ...variants
  };
};

const mergeRhythmVariants = (
  base: AmbientLayerPreset,
  tweak?: Partial<AmbientLayerPreset>
): AmbientPatternVariant[] | undefined => {
  if (tweak?.rhythmVariants) {
    return tweak.rhythmVariants;
  }

  if (!base.rhythmVariants?.length) {
    return undefined;
  }

  const probabilityScale =
    typeof tweak?.probability === 'number' && base.probability > 0
      ? tweak.probability / base.probability
      : 1;
  const durationScale =
    typeof tweak?.durationSteps === 'number' && base.durationSteps > 0
      ? tweak.durationSteps / base.durationSteps
      : 1;
  const filterOffset =
    typeof tweak?.filterHz === 'number' && typeof base.filterHz === 'number'
      ? tweak.filterHz - base.filterHz
      : 0;
  const octaveOffsetDelta =
    typeof tweak?.octaveOffset === 'number'
      ? tweak.octaveOffset - (base.octaveOffset ?? 0)
      : 0;
  const probabilityCap = base.id === 'wind' ? 0.24 : base.id === 'hat' ? 0.42 : base.id === 'snare' ? 0.4 : base.voice === 'noise' ? 0.34 : 1;

  return base.rhythmVariants.map((variant) => ({
    ...variant,
    probability:
      typeof variant.probability === 'number'
        ? Math.min(probabilityCap, clampProbability(variant.probability * probabilityScale))
        : tweak?.probability,
    durationSteps:
      typeof variant.durationSteps === 'number'
        ? Math.max(1, Math.round(variant.durationSteps * durationScale))
        : tweak?.durationSteps,
    filterHz:
      typeof variant.filterHz === 'number'
        ? Math.max(120, variant.filterHz + filterOffset)
        : tweak?.filterHz ?? base.filterHz,
    octaveOffset:
      typeof variant.octaveOffset === 'number'
        ? variant.octaveOffset + octaveOffsetDelta
        : tweak?.octaveOffset
  }));
};

const mergeLayer = (base: AmbientLayerPreset, tweak?: Partial<AmbientLayerPreset>): AmbientLayerPreset => {
  if (!tweak) return { ...base };
  return {
    ...base,
    ...tweak,
    phases: tweak.phases ?? base.phases,
    intensities: tweak.intensities ?? base.intensities,
    rhythmVariants: mergeRhythmVariants(base, tweak),
    accentVariants: tweak.accentVariants ?? base.accentVariants,
    mirrorVariants: tweak.mirrorVariants ?? base.mirrorVariants,
    degreeVariants: tweak.degreeVariants ?? base.degreeVariants,
    generatorVariants: tweak.generatorVariants ?? base.generatorVariants
  };
};

const createPreset = (
  rootMidi: number,
  scaleIntervals: number[],
  bpmExplore: number,
  options?: PresetOptions
): AmbientPreset => {
  const bpm: Record<AmbientIntensity, number> = {
    idle: Math.max(60, bpmExplore - 16),
    hub: Math.max(68, bpmExplore - 8),
    explore: bpmExplore,
    battle: bpmExplore + 14
  };

  return {
    bpm,
    density: {
      idle: options?.density?.idle ?? BASE_DENSITY.idle,
      hub: options?.density?.hub ?? BASE_DENSITY.hub,
      explore: options?.density?.explore ?? BASE_DENSITY.explore,
      battle: options?.density?.battle ?? BASE_DENSITY.battle
    },
    rootMidi,
    scaleIntervals,
    layers: BASE_LAYERS.map((layer) => mergeLayer(enrichBaseLayer(layer), options?.layerTweaks?.[layer.id]))
  };
};

export const AMBIENT_PRESETS: Record<TerrainAudioKey, AmbientPreset> = {
  normal: createPreset(60, MAJOR_PENTATONIC, 86, {
    layerTweaks: {
      bass: { gain: 0.108, weight: 1.48 },
      kick: { gain: 0.104, weight: 1.38 },
      subPiano: { weight: 0.52, probability: 0.48 },
      guitar: { weight: 1.08 },
      hangpan: { weight: 0.92 },
      wind: { weight: 0.78, gain: 0.012 },
      vocalOoh: { weight: 0.28 },
      vocalAah: { weight: 0.24 }
    }
  }),
  plante: createPreset(62, DORIAN, 80, {
    layerTweaks: {
      bass: { gain: 0.106, weight: 1.5 },
      subPiano: { weight: 0.48, probability: 0.44 },
      wind: { weight: 1.3, gain: 0.02, filterHz: 920 },
      guitar: { weight: 1.18, gain: 0.03 },
      hangpan: { weight: 1.05, gain: 0.032 },
      kick: { weight: 1.0, probability: 0.82, gain: 0.102 },
      snare: { weight: 0.76, probability: 0.66 },
      chord: { weight: 1.18, filterHz: 1420 },
      vocalOoh: { weight: 0.34, probability: 0.28 },
      vocalAir: { weight: 0.2, probability: 0.12 }
    }
  }),
  tenebres: createPreset(57, MINOR_PENTATONIC, 72, {
    density: {
      idle: { min: 2, max: 2 },
      hub: { min: 2, max: 3 },
      explore: { min: 3, max: 4 },
      battle: { min: 4, max: 5 }
    },
    layerTweaks: {
      bass: { gain: 0.11, weight: 1.5, filterHz: 620 },
      subPiano: { weight: 0.58, probability: 0.5, gain: 0.064, filterHz: 260 },
      wind: { weight: 1.42, gain: 0.02, filterHz: 620, durationSteps: 8 },
      chord: { weight: 1.2, gain: 0.028, filterHz: 1180 },
      hangpan: { weight: 1.16, gain: 0.03, filterHz: 1020 },
      guitar: { weight: 0.32, probability: 0.42 },
      hat: { weight: 0.45, probability: 0.5, filterHz: 4200 },
      kick: { weight: 0.82, probability: 0.66, gain: 0.096 },
      snare: { weight: 0.52, probability: 0.54 },
      arp: { weight: 0.48, probability: 0.54 },
      lead: { gain: 0.045, filterHz: 1350 },
      vocalOoh: { weight: 0.42, probability: 0.32, gain: 0.028, durationSteps: 10 },
      vocalAah: { weight: 0.36, probability: 0.26, gain: 0.026, durationSteps: 8 },
      vocalAir: { weight: 0.3, probability: 0.2, gain: 0.022, durationSteps: 12 }
    }
  }),
  eau: createPreset(59, DORIAN, 76, {
    layerTweaks: {
      bass: { gain: 0.106, weight: 1.46 },
      kick: { gain: 0.1, weight: 1.18 },
      subPiano: { weight: 0.46, probability: 0.42 },
      wind: { weight: 1.26, gain: 0.017, filterHz: 840 },
      hangpan: { weight: 1.1, gain: 0.035 },
      snare: { weight: 0.8 },
      guitar: { weight: 0.82 },
      vocalOoh: { weight: 0.36, probability: 0.26 },
      vocalAah: { weight: 0.26, probability: 0.18 }
    }
  }),
  feu: createPreset(64, MAJOR_PENTATONIC, 94, {
    layerTweaks: {
      bass: { gain: 0.11, weight: 1.56 },
      kick: { weight: 1.5, gain: 0.114 },
      subPiano: { weight: 0.4, probability: 0.34, gain: 0.052 },
      snare: { weight: 1.12, gain: 0.034 },
      hat: { weight: 1.04 },
      lead: { weight: 1.2, gain: 0.06 },
      wind: { weight: 0.32 }
    }
  }),
  electrique: createPreset(66, LYDIAN, 98, {
    layerTweaks: {
      bass: { gain: 0.11, weight: 1.52 },
      kick: { gain: 0.11, weight: 1.44 },
      hat: { weight: 1.24, probability: 0.88, filterHz: 5600 },
      arp: { weight: 1.24, gain: 0.026, probability: 0.9 },
      lead: { weight: 1.14 },
      chord: { weight: 0.82 }
    }
  }),
  glace: createPreset(62, LYDIAN, 70, {
    density: {
      idle: { min: 2, max: 2 },
      hub: { min: 2, max: 3 },
      explore: { min: 3, max: 4 },
      battle: { min: 4, max: 5 }
    },
    layerTweaks: {
      bass: { gain: 0.106, weight: 1.46 },
      subPiano: { weight: 0.54, probability: 0.46, gain: 0.062 },
      wind: { weight: 1.38, gain: 0.018, filterHz: 760 },
      hangpan: { weight: 1.12, filterHz: 1440 },
      kick: { weight: 0.94, gain: 0.102 },
      snare: { weight: 0.72 },
      guitar: { weight: 0.48 },
      vocalAir: { weight: 0.28, probability: 0.18 }
    }
  }),
  combat: createPreset(60, NATURAL_MINOR, 96, {
    density: {
      battle: { min: 5, max: 6 }
    },
    layerTweaks: {
      kick: { weight: 1.66, gain: 0.125, probability: 0.98 },
      snare: { weight: 1.22, gain: 0.035 },
      hat: { weight: 1.1 },
      bass: { weight: 1.66, gain: 0.125, filterHz: 700 },
      subPiano: { weight: 0.5, probability: 0.38, gain: 0.06, intensities: ['battle'] },
      lead: { weight: 1.18 },
      arp: { weight: 1.02 }
    }
  }),
  poison: createPreset(58, NATURAL_MINOR, 84, {
    layerTweaks: {
      bass: { gain: 0.108, weight: 1.48 },
      kick: { gain: 0.104, weight: 1.26 },
      subPiano: { weight: 0.5, probability: 0.42 },
      chord: { weight: 1.12, filterHz: 1320 },
      hangpan: { weight: 0.82 },
      wind: { weight: 0.92, filterHz: 680 },
      vocalOoh: { weight: 0.32, probability: 0.24 }
    }
  }),
  sol: createPreset(55, NATURAL_MINOR, 78, {
    layerTweaks: {
      bass: { weight: 1.54, gain: 0.115, filterHz: 700 },
      kick: { weight: 1.24, gain: 0.108 },
      subPiano: { weight: 0.62, probability: 0.5, gain: 0.066, filterHz: 240 },
      wind: { weight: 0.44 },
      guitar: { weight: 0.76 }
    }
  }),
  vol: createPreset(67, MAJOR_PENTATONIC, 88, {
    layerTweaks: {
      wind: { weight: 1.2, gain: 0.018, filterHz: 940 },
      hat: { weight: 0.84 },
      hangpan: { weight: 1.0, gain: 0.032 }
    }
  }),
  psy: createPreset(65, LYDIAN, 84, {
    layerTweaks: {
      bass: { gain: 0.106, weight: 1.42 },
      subPiano: { weight: 0.48, probability: 0.4 },
      hangpan: { weight: 1.22, gain: 0.038 },
      lead: { weight: 0.92 },
      wind: { weight: 0.74 },
      chord: { weight: 1.08 },
      vocalOoh: { weight: 0.4, probability: 0.3 },
      vocalAah: { weight: 0.34, probability: 0.24 },
      vocalAir: { weight: 0.26, probability: 0.16 }
    }
  }),
  insecte: createPreset(61, DORIAN, 90, {
    layerTweaks: {
      hat: { weight: 1.18, probability: 0.86 },
      guitar: { weight: 0.9 },
      wind: { weight: 0.58 }
    }
  }),
  roche: createPreset(52, NATURAL_MINOR, 74, {
    density: {
      idle: { min: 2, max: 2 },
      hub: { min: 3, max: 3 },
      explore: { min: 3, max: 4 },
      battle: { min: 4, max: 5 }
    },
    layerTweaks: {
      bass: { weight: 1.62, gain: 0.122 },
      kick: { weight: 1.32, gain: 0.112 },
      subPiano: { weight: 0.7, probability: 0.56, gain: 0.072, filterHz: 220 },
      hat: { weight: 0.58 },
      wind: { weight: 0.24 },
      chord: { filterHz: 1180 }
    }
  }),
  spectre: createPreset(56, MINOR_PENTATONIC, 68, {
    density: {
      idle: { min: 2, max: 2 },
      hub: { min: 2, max: 3 },
      explore: { min: 3, max: 4 },
      battle: { min: 4, max: 5 }
    },
    layerTweaks: {
      bass: { gain: 0.112, weight: 1.54, filterHz: 620 },
      subPiano: { weight: 0.6, probability: 0.54, gain: 0.066, filterHz: 240 },
      wind: { weight: 1.36, gain: 0.02, filterHz: 640 },
      chord: { weight: 1.18, filterHz: 1100 },
      hangpan: { weight: 1.14 },
      guitar: { weight: 0.24 },
      kick: { weight: 0.8, gain: 0.1 },
      snare: { weight: 0.5 },
      arp: { weight: 0.54 },
      vocalOoh: { weight: 0.46, probability: 0.34, gain: 0.03, durationSteps: 10 },
      vocalAah: { weight: 0.38, probability: 0.28, gain: 0.026, durationSteps: 8 },
      vocalAir: { weight: 0.32, probability: 0.2, gain: 0.022, durationSteps: 12 }
    }
  }),
  dragon: createPreset(62, NATURAL_MINOR, 94, {
    layerTweaks: {
      bass: { weight: 1.58, gain: 0.12 },
      kick: { weight: 1.38, gain: 0.114 },
      subPiano: { weight: 0.46, probability: 0.38 },
      lead: { weight: 1.18, gain: 0.058 },
      chord: { weight: 0.88 },
      hangpan: { weight: 0.46 }
    }
  }),
  acier: createPreset(60, MAJOR_PENTATONIC, 86, {
    layerTweaks: {
      bass: { gain: 0.11, weight: 1.5 },
      kick: { gain: 0.104, weight: 1.26 },
      subPiano: { weight: 0.44, probability: 0.36 },
      hat: { weight: 1.08, filterHz: 6000 },
      chord: { weight: 1.14, filterHz: 1740 },
      hangpan: { weight: 0.42 },
      wind: { weight: 0.28 }
    }
  }),
  fee: createPreset(69, LYDIAN, 82, {
    density: {
      idle: { min: 2, max: 3 },
      hub: { min: 3, max: 4 },
      explore: { min: 4, max: 5 },
      battle: { min: 4, max: 5 }
    },
    layerTweaks: {
      bass: { gain: 0.106, weight: 1.46 },
      subPiano: { weight: 0.42, probability: 0.34 },
      hangpan: { weight: 1.28, gain: 0.038, filterHz: 1520 },
      chord: { weight: 1.18, gain: 0.034 },
      guitar: { weight: 0.72 },
      kick: { weight: 0.82, probability: 0.64, gain: 0.098 },
      snare: { weight: 0.54 },
      vocalOoh: { weight: 0.44, probability: 0.34, gain: 0.03 },
      vocalAah: { weight: 0.38, probability: 0.28, gain: 0.028 },
      vocalAir: { weight: 0.28, probability: 0.18, gain: 0.022 }
    }
  })
};

export const resolveAmbientPreset = (terrain?: string | null): AmbientPreset => {
  return AMBIENT_PRESETS[normalizeTerrainKey(terrain)];
};
