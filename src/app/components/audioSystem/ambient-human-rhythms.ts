import type {
  AmbientHumanRhythmId,
  AmbientIntensity,
  AmbientLayerId,
  AmbientPhase
} from './ambient-presets';

export type HumanRhythmFamily = 'latin' | 'caribbean' | 'afro' | 'rock' | 'club';
export type HumanRhythmSubdivision = 'straight' | 'triplet';

export type HumanRhythmLane = {
  pattern: boolean[];
  accents?: number[];
  probability?: number;
  durationSteps?: number;
  filterOffset?: number;
  octaveOffset?: number;
};

export type HumanRhythmPattern = {
  id: AmbientHumanRhythmId;
  family: HumanRhythmFamily;
  steps: number;
  cycleBars: 1 | 2;
  subdivision: HumanRhythmSubdivision;
  intensities: AmbientIntensity[];
  phases: AmbientPhase[];
  weight: number;
  lanes: Partial<Record<AmbientLayerId, HumanRhythmLane>>;
};

const createPattern = (steps: number, activeSteps: number[]): boolean[] => {
  const pattern = Array.from({ length: steps }, () => false);
  activeSteps.forEach((step) => {
    pattern[((step % steps) + steps) % steps] = true;
  });
  return pattern;
};

const createAccentPattern = (
  steps: number,
  accents: Array<[number, number]>,
  baseValue = 0.72
): number[] => {
  const pattern = Array.from({ length: steps }, () => baseValue);
  accents.forEach(([step, value]) => {
    pattern[((step % steps) + steps) % steps] = value;
  });
  return pattern;
};

const EIGHTH_HAT_ACCENTS = createAccentPattern(16, [
  [0, 0.96],
  [2, 0.84],
  [4, 0.94],
  [6, 0.82],
  [8, 1.02],
  [10, 0.84],
  [12, 0.96],
  [14, 0.82]
], 0.56);

export const HUMAN_RHYTHM_LIBRARY: HumanRhythmPattern[] = [
  {
    id: 'tresillo',
    family: 'latin',
    steps: 16,
    cycleBars: 1,
    subdivision: 'straight',
    intensities: ['hub', 'explore', 'battle'],
    phases: ['A', 'B', 'C'],
    weight: 1.02,
    lanes: {
      kick: {
        pattern: createPattern(16, [0, 6, 12]),
        accents: createAccentPattern(16, [[0, 1.3], [6, 1.08], [12, 1.2]], 0.68),
        probability: 0.97
      },
      bass: {
        pattern: createPattern(16, [0, 6, 12]),
        accents: createAccentPattern(16, [[0, 1.18], [6, 1.04], [12, 1.12]], 0.72),
        probability: 0.94,
        durationSteps: 2
      },
      chord: {
        pattern: createPattern(16, [0, 6, 12]),
        accents: createAccentPattern(16, [[0, 1.12], [6, 0.98], [12, 1.08]], 0.78),
        probability: 0.82,
        durationSteps: 3
      },
      guitar: {
        pattern: createPattern(16, [0, 6, 12]),
        accents: createAccentPattern(16, [[0, 1.1], [6, 0.96], [12, 1.04]], 0.76),
        probability: 0.76,
        durationSteps: 2
      }
    }
  },
  {
    id: 'dembow',
    family: 'caribbean',
    steps: 16,
    cycleBars: 1,
    subdivision: 'straight',
    intensities: ['explore', 'battle'],
    phases: ['B', 'C'],
    weight: 1.12,
    lanes: {
      kick: {
        pattern: createPattern(16, [0, 10, 12]),
        accents: createAccentPattern(16, [[0, 1.28], [10, 1.02], [12, 1.18]], 0.68),
        probability: 0.98
      },
      snare: {
        pattern: createPattern(16, [6, 14]),
        accents: createAccentPattern(16, [[6, 1.2], [14, 1.08]], 0.62),
        probability: 0.78
      },
      hat: {
        pattern: createPattern(16, [2, 6, 10, 14]),
        accents: createAccentPattern(16, [[2, 0.94], [6, 1.0], [10, 0.92], [14, 1.02]], 0.5),
        probability: 0.48
      },
      bass: {
        pattern: createPattern(16, [0, 10, 12]),
        accents: createAccentPattern(16, [[0, 1.16], [10, 0.96], [12, 1.08]], 0.7),
        probability: 0.92,
        durationSteps: 2
      }
    }
  },
  {
    id: 'clave-3-2',
    family: 'latin',
    steps: 32,
    cycleBars: 2,
    subdivision: 'straight',
    intensities: ['hub', 'explore'],
    phases: ['A', 'B', 'C'],
    weight: 0.88,
    lanes: {
      hat: {
        pattern: createPattern(32, [0, 6, 12, 20, 24]),
        accents: createAccentPattern(32, [[0, 1.06], [6, 0.94], [12, 1.04], [20, 0.96], [24, 1.02]], 0.52),
        probability: 0.42
      },
      chord: {
        pattern: createPattern(32, [0, 6, 12, 20, 24]),
        accents: createAccentPattern(32, [[0, 1.08], [6, 0.96], [12, 1.06], [20, 0.98], [24, 1.02]], 0.74),
        probability: 0.74,
        durationSteps: 2
      },
      guitar: {
        pattern: createPattern(32, [0, 6, 12, 20, 24]),
        accents: createAccentPattern(32, [[0, 1.1], [6, 0.98], [12, 1.04], [20, 0.96], [24, 1.0]], 0.74),
        probability: 0.76,
        durationSteps: 2
      },
      arp: {
        pattern: createPattern(32, [0, 6, 12, 20, 24]),
        accents: createAccentPattern(32, [[0, 1.02], [6, 0.9], [12, 1.0], [20, 0.92], [24, 0.98]], 0.7),
        probability: 0.78
      }
    }
  },
  {
    id: 'clave-2-3',
    family: 'latin',
    steps: 32,
    cycleBars: 2,
    subdivision: 'straight',
    intensities: ['hub', 'explore'],
    phases: ['A', 'B', 'C'],
    weight: 0.86,
    lanes: {
      hat: {
        pattern: createPattern(32, [4, 8, 16, 22, 28]),
        accents: createAccentPattern(32, [[4, 0.98], [8, 1.04], [16, 1.02], [22, 0.96], [28, 1.06]], 0.52),
        probability: 0.42
      },
      chord: {
        pattern: createPattern(32, [4, 8, 16, 22, 28]),
        accents: createAccentPattern(32, [[4, 1.0], [8, 1.06], [16, 1.04], [22, 0.98], [28, 1.08]], 0.74),
        probability: 0.74,
        durationSteps: 2
      },
      guitar: {
        pattern: createPattern(32, [4, 8, 16, 22, 28]),
        accents: createAccentPattern(32, [[4, 1.02], [8, 1.08], [16, 1.02], [22, 0.96], [28, 1.04]], 0.74),
        probability: 0.76,
        durationSteps: 2
      },
      arp: {
        pattern: createPattern(32, [4, 8, 16, 22, 28]),
        accents: createAccentPattern(32, [[4, 0.98], [8, 1.02], [16, 1.0], [22, 0.92], [28, 1.04]], 0.7),
        probability: 0.78
      }
    }
  },
  {
    id: 'backbeat',
    family: 'rock',
    steps: 16,
    cycleBars: 1,
    subdivision: 'straight',
    intensities: ['hub', 'explore', 'battle'],
    phases: ['B', 'C'],
    weight: 0.96,
    lanes: {
      kick: {
        pattern: createPattern(16, [0, 8]),
        accents: createAccentPattern(16, [[0, 1.18], [8, 1.08]], 0.68),
        probability: 0.94
      },
      snare: {
        pattern: createPattern(16, [4, 12]),
        accents: createAccentPattern(16, [[4, 1.18], [12, 1.22]], 0.62),
        probability: 0.84
      },
      hat: {
        pattern: createPattern(16, [0, 2, 4, 6, 8, 10, 12, 14]),
        accents: EIGHTH_HAT_ACCENTS,
        probability: 0.38
      },
      bass: {
        pattern: createPattern(16, [0, 8]),
        accents: createAccentPattern(16, [[0, 1.1], [8, 1.04]], 0.72),
        probability: 0.88,
        durationSteps: 2
      }
    }
  },
  {
    id: 'offbeat-hat',
    family: 'rock',
    steps: 16,
    cycleBars: 1,
    subdivision: 'straight',
    intensities: ['hub', 'explore', 'battle'],
    phases: ['A', 'B', 'C'],
    weight: 0.9,
    lanes: {
      hat: {
        pattern: createPattern(16, [2, 6, 10, 14]),
        accents: createAccentPattern(16, [[2, 1.04], [6, 0.96], [10, 1.0], [14, 1.08]], 0.48),
        probability: 0.46
      },
      chord: {
        pattern: createPattern(16, [2, 6, 10, 14]),
        accents: createAccentPattern(16, [[2, 1.0], [6, 0.94], [10, 0.98], [14, 1.04]], 0.74),
        probability: 0.72,
        durationSteps: 2
      },
      guitar: {
        pattern: createPattern(16, [2, 6, 10, 14]),
        accents: createAccentPattern(16, [[2, 1.04], [6, 0.96], [10, 1.0], [14, 1.06]], 0.74),
        probability: 0.74,
        durationSteps: 2
      },
      arp: {
        pattern: createPattern(16, [2, 6, 10, 14]),
        accents: createAccentPattern(16, [[2, 0.98], [6, 0.92], [10, 0.96], [14, 1.0]], 0.7),
        probability: 0.78
      }
    }
  },
  {
    id: 'one-drop',
    family: 'caribbean',
    steps: 16,
    cycleBars: 1,
    subdivision: 'straight',
    intensities: ['hub', 'explore'],
    phases: ['A', 'B', 'break'],
    weight: 0.72,
    lanes: {
      kick: {
        pattern: createPattern(16, [8]),
        accents: createAccentPattern(16, [[8, 1.16]], 0.66),
        probability: 0.88
      },
      snare: {
        pattern: createPattern(16, [8]),
        accents: createAccentPattern(16, [[8, 1.24]], 0.6),
        probability: 0.78
      },
      hat: {
        pattern: createPattern(16, [2, 6, 10, 14]),
        accents: createAccentPattern(16, [[2, 0.96], [6, 0.92], [10, 0.98], [14, 1.02]], 0.48),
        probability: 0.42
      },
      bass: {
        pattern: createPattern(16, [0, 8, 12]),
        accents: createAccentPattern(16, [[0, 1.04], [8, 1.14], [12, 0.96]], 0.72),
        probability: 0.84,
        durationSteps: 2
      }
    }
  },
  {
    id: 'motorik',
    family: 'club',
    steps: 16,
    cycleBars: 1,
    subdivision: 'straight',
    intensities: ['explore', 'battle'],
    phases: ['C'],
    weight: 0.74,
    lanes: {
      kick: {
        pattern: createPattern(16, [0, 4, 8, 12]),
        accents: createAccentPattern(16, [[0, 1.16], [4, 1.0], [8, 1.12], [12, 1.02]], 0.68),
        probability: 0.96
      },
      hat: {
        pattern: createPattern(16, [0, 2, 4, 6, 8, 10, 12, 14]),
        accents: EIGHTH_HAT_ACCENTS,
        probability: 0.42
      },
      bass: {
        pattern: createPattern(16, [0, 4, 8, 12]),
        accents: createAccentPattern(16, [[0, 1.08], [4, 0.98], [8, 1.04], [12, 0.98]], 0.72),
        probability: 0.88,
        durationSteps: 2
      }
    }
  },
  // Straight-grid approximation until the engine supports true 12/8 subdivisions.
  {
    id: 'bembe',
    family: 'afro',
    steps: 16,
    cycleBars: 1,
    subdivision: 'straight',
    intensities: ['idle', 'hub', 'explore'],
    phases: ['A', 'B', 'break'],
    weight: 0.66,
    lanes: {
      hat: {
        pattern: createPattern(16, [0, 3, 6, 8, 10, 12, 15]),
        accents: createAccentPattern(16, [[0, 1.0], [3, 0.9], [6, 1.02], [8, 0.92], [10, 0.98], [12, 1.04], [15, 0.94]], 0.48),
        probability: 0.38
      },
      chord: {
        pattern: createPattern(16, [0, 6, 10]),
        accents: createAccentPattern(16, [[0, 1.08], [6, 1.0], [10, 1.04]], 0.74),
        probability: 0.72,
        durationSteps: 3
      },
      hangpan: {
        pattern: createPattern(16, [0, 6, 10]),
        accents: createAccentPattern(16, [[0, 1.08], [6, 1.0], [10, 1.02]], 0.78),
        probability: 0.72,
        durationSteps: 2
      },
      arp: {
        pattern: createPattern(16, [0, 3, 6, 10, 12, 15]),
        accents: createAccentPattern(16, [[0, 1.0], [3, 0.92], [6, 1.02], [10, 0.98], [12, 1.0], [15, 0.94]], 0.68),
        probability: 0.76
      }
    }
  }
];

const HUMAN_RHYTHM_BY_ID: Record<AmbientHumanRhythmId, HumanRhythmPattern> = HUMAN_RHYTHM_LIBRARY.reduce(
  (accumulator, pattern) => {
    accumulator[pattern.id] = pattern;
    return accumulator;
  },
  {} as Record<AmbientHumanRhythmId, HumanRhythmPattern>
);

export const getHumanRhythmPattern = (id: AmbientHumanRhythmId): HumanRhythmPattern => {
  return HUMAN_RHYTHM_BY_ID[id];
};
