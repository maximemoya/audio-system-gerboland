import {
  buildEuclideanPattern,
  clamp,
  createSeededRandom,
  midiToFrequency,
  normalizeTerrainKey,
  pickRandom,
  rotatePattern,
  stepDurationFromBpm,
  type TerrainAudioKey
} from './ambient-math';
import {
  getHumanRhythmPattern,
  type HumanRhythmLane,
  type HumanRhythmPattern
} from './ambient-human-rhythms';
import {
  type AmbientDensityRange,
  resolveAmbientPreset,
  type AmbientGeneratorVariant,
  type AmbientHumanRhythmId,
  type AmbientIntensity,
  type AmbientLayerId,
  type AmbientLayerFamily,
  type AmbientLayerPreset,
  type AmbientMirrorMode,
  type AmbientPhase,
  type AmbientPreset,
  type AmbientVoice
} from './ambient-presets';
import {
  selectAmbientTheme,
  type AmbientTheme
} from './ambient-themes';

export type PersistedAmbientSettings = {
  enabled: boolean;
  volume: number;
};

export type AmbientDebugState = {
  settings: PersistedAmbientSettings;
  terrain: TerrainAudioKey | null;
  intensity: AmbientIntensity | null;
  themeId: string | null;
  isRunning: boolean;
};

type LayerVariantOffsets = {
  rhythm: number;
  accent: number;
  mirror: number;
  degree: number;
  filter: number;
  generator: number;
};

type ResolvedLayerRuntime = {
  steps: number;
  pulses: number;
  rotation: number;
  probability: number;
  durationSteps: number;
  octaveOffset?: number;
  filterHz?: number;
  accentPattern?: number[];
  mirrorMode?: AmbientMirrorMode;
  degreePattern?: number[];
  generator?: AmbientGeneratorVariant;
  humanPattern?: boolean[];
  humanRhythmId?: AmbientHumanRhythmId;
};

type ResolvedAccentStep = {
  gainScale: number;
  filterScale: number;
  durationScale: number;
  attackScale: number;
};

type MusicalFxSend = {
  delaySend: number;
  reverbSend: number;
  tapeEchoSend: number;
};

type BassRiffTemplate = {
  degrees: number[];
  durations: number[];
  gainScale: number;
  octaveOffset: number;
};

type BassRiffState = {
  startStep: number;
  totalSteps: number;
  template: BassRiffTemplate;
};

type PendingEnvironmentTransition = {
  sourceTerrainKey: TerrainAudioKey;
  sourceIntensity: AmbientIntensity;
  sourcePreset: AmbientPreset;
  sourceRandom: () => number;
  sourceTheme: AmbientTheme | null;
  sourceBpmDriftPhaseOffset: number;
  terrainKey: TerrainAudioKey;
  intensity: AmbientIntensity;
  targetPreset: AmbientPreset;
  targetTheme: AmbientTheme | null;
  startLayers: AmbientLayerPreset[];
  targetLayers: AmbientLayerPreset[];
  startHumanRhythmIds: AmbientHumanRhythmId[];
  targetHumanRhythmIds: AmbientHumanRhythmId[];
  startStep: number;
  endStep: number;
  lastLayerSwapCount: number;
  lastHumanRhythmSwapCount: number;
};

type PendingRhythmTransition = {
  fromCounter: number;
  toCounter: number;
  fromRotationShift: number;
  toRotationShift: number;
  startStep: number;
  endStep: number;
};

const SETTINGS_STORAGE_KEY = 'geobiloand.ambient.settings';
const DEFAULT_SETTINGS: PersistedAmbientSettings = {
  enabled: true,
  volume: 0.8
};
const AMBIENT_OUTPUT_GAIN_MULTIPLIER = 1.6;
const MAX_AMBIENT_OUTPUT_GAIN = 1.2;
const SIDECHAIN_DUCK_GAIN = 0.72;
const SIDECHAIN_ATTACK_SEC = 0.012;
const SIDECHAIN_RELEASE_SEC = 0.2;
const LOOKAHEAD_SEC = 0.12;
const TICK_MS = 25;
const STEPS_PER_BAR = 16;
const RHYTHM_ROTATION_BARS: Record<AmbientIntensity, number> = {
  idle: 8,
  hub: 8,
  explore: 8,
  battle: 6
};
const RHYTHM_VARIATION_BARS: Record<AmbientIntensity, number> = {
  idle: 12,
  hub: 12,
  explore: 12,
  battle: 8
};
const MELODY_VARIATION_BARS: Record<AmbientIntensity, number> = {
  idle: 64,
  hub: 56,
  explore: 48,
  battle: 32
};
const RHYTHM_TRANSITION_STEPS = 32;
const BASS_RIFF_CHANCE: Record<AmbientIntensity, number> = {
  idle: 0,
  hub: 0.16,
  explore: 0.22,
  battle: 0.1
};
const BASS_RIFF_TEMPLATES: BassRiffTemplate[] = [
  {
    degrees: [0, 2, 4, 2],
    durations: [2, 2, 2, 2],
    gainScale: 0.96,
    octaveOffset: 0
  },
  {
    degrees: [0, 3, 4, 1],
    durations: [3, 1, 2, 2],
    gainScale: 0.92,
    octaveOffset: 0
  },
  {
    degrees: [0, 4, 2, 5],
    durations: [2, 3, 1, 2],
    gainScale: 0.9,
    octaveOffset: 0
  }
];
const PHASE_ORDER: AmbientPhase[] = ['A', 'B', 'C', 'break'];
const PHASE_BARS: Record<AmbientIntensity, Record<AmbientPhase, number>> = {
  idle: { A: 8, B: 8, C: 4, break: 4 },
  hub: { A: 8, B: 8, C: 8, break: 4 },
  explore: { A: 8, B: 8, C: 8, break: 4 },
  battle: { A: 4, B: 4, C: 4, break: 2 }
};
const CARRY_LIMIT: Record<AmbientIntensity, number> = {
  idle: 1,
  hub: 2,
  explore: 2,
  battle: 3
};
const FAMILY_CAPS: Record<AmbientIntensity, Record<AmbientLayerFamily, number>> = {
  idle: { rhythm: 1, low: 1, harmony: 2, melody: 1, texture: 1 },
  hub: { rhythm: 2, low: 2, harmony: 2, melody: 1, texture: 1 },
  explore: { rhythm: 3, low: 2, harmony: 2, melody: 1, texture: 1 },
  battle: { rhythm: 3, low: 2, harmony: 2, melody: 1, texture: 1 }
};
const MEDIUM_HARMONY_SETTINGS: Partial<Record<AmbientLayerPreset['id'], { probability: number; triadProbability: number }>> = {
  lead: { probability: 0.68, triadProbability: 0.18 },
  guitar: { probability: 0.76, triadProbability: 0.14 },
  hangpan: { probability: 0.62, triadProbability: 0.1 },
  arp: { probability: 0.42, triadProbability: 0.08 }
};
const MIRROR_ENABLED_PHASES: AmbientPhase[] = ['A', 'break'];
const FX_DELAY_LAYER_IDS: AmbientLayerPreset['id'][] = ['lead', 'guitar', 'hangpan', 'vocalOoh', 'vocalAah', 'vocalAir'];
const FX_REVERB_LAYER_IDS: AmbientLayerPreset['id'][] = ['chord', 'hangpan', 'vocalOoh', 'vocalAah', 'vocalAir', 'wind'];
const FX_TAPE_ECHO_LAYER_IDS: AmbientLayerPreset['id'][] = ['lead', 'guitar', 'hangpan', 'vocalOoh', 'vocalAah', 'vocalAir', 'chord'];
const FX_BASE_FILTERS = {
  melody: 3200,
  harmony: 2600,
  texture: 1800
};
const TAPE_ECHO_ENABLED = false;
const TAPE_ECHO_BASE_FEEDBACK: Record<AmbientIntensity, number> = {
  idle: 0.34,
  hub: 0.32,
  explore: 0.3,
  battle: 0.26
};
const TAPE_ECHO_SPOTLIGHT_FEEDBACK: Record<AmbientIntensity, number> = {
  idle: 0.58,
  hub: 0.56,
  explore: 0.54,
  battle: 0.48
};
const TAPE_ECHO_BASE_RETURN: Record<AmbientIntensity, number> = {
  idle: 0.1,
  hub: 0.095,
  explore: 0.085,
  battle: 0.07
};
const TAPE_ECHO_SPOTLIGHT_RETURN: Record<AmbientIntensity, number> = {
  idle: 0.18,
  hub: 0.17,
  explore: 0.16,
  battle: 0.13
};
const TAPE_ECHO_TIME_MULTIPLIER: Record<AmbientIntensity, number> = {
  idle: 6,
  hub: 5.5,
  explore: 5,
  battle: 4
};
const TAPE_ECHO_TRIGGER_CHANCE: Record<AmbientIntensity, number> = {
  idle: 0.08,
  hub: 0.065,
  explore: 0.045,
  battle: 0.025
};
const TAPE_ECHO_SPOTLIGHT_DURATION_SEC = 10;
const TAPE_ECHO_SPOTLIGHT_COOLDOWN_SEC = 8;
const TAPE_ECHO_SPOTLIGHT_DUCK_GAIN = 0.028;
const TAPE_ECHO_SPOTLIGHT_ATTACK_SEC = 0.14;
const TAPE_ECHO_SPOTLIGHT_HOLD_SEC = 8.8;
const TAPE_ECHO_SPOTLIGHT_RELEASE_SEC = 1.2;
const NEUTRAL_ACCENT_STEP: ResolvedAccentStep = {
  gainScale: 1,
  filterScale: 1,
  durationScale: 1,
  attackScale: 1
};
const HUMAN_RHYTHM_DENSITY: Record<AmbientIntensity, { min: number; max: number }> = {
  idle: { min: 0, max: 1 },
  hub: { min: 1, max: 1 },
  explore: { min: 1, max: 2 },
  battle: { min: 1, max: 2 }
};
const BPM_SWING_MAX = 10;
const BPM_SWING_SCALE: Record<AmbientIntensity, number> = {
  idle: 0.55,
  hub: 0.5,
  explore: 0.45,
  battle: 0.12
};
const BPM_SWING_CYCLE_BARS: Record<AmbientIntensity, number> = {
  idle: 112,
  hub: 104,
  explore: 96,
  battle: 128
};
const ENVIRONMENT_TRANSITION_BEATS = 24;
const ENVIRONMENT_TRANSITION_STEPS = ENVIRONMENT_TRANSITION_BEATS * 4;
const ENVIRONMENT_TRANSITION_SWAP_INTERVAL_STEPS = 8;
const ANCHOR_LAYER_IDS: Record<AmbientIntensity, AmbientLayerPreset['id'][]> = {
  idle: [],
  hub: ['bass', 'kick'],
  explore: ['bass', 'kick'],
  battle: ['bass', 'kick']
};

const parseSettings = (raw: string | null): PersistedAmbientSettings => {
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedAmbientSettings>;
    return {
      enabled: parsed.enabled !== false,
      volume: typeof parsed.volume === 'number' ? clamp(parsed.volume, 0, 1) : DEFAULT_SETTINGS.volume
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const resolveAmbientOutputGain = (volume: number, enabled: boolean): number => {
  if (!enabled) return 0.0001;
  return clamp(volume * AMBIENT_OUTPUT_GAIN_MULTIPLIER, 0.0001, MAX_AMBIENT_OUTPUT_GAIN);
};

class AmbientEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBedGain: GainNode | null = null;
  private tonalBusGain: GainNode | null = null;
  private rhythmBusGain: GainNode | null = null;
  private melodyBusGain: GainNode | null = null;
  private melodyBusFilter: BiquadFilterNode | null = null;
  private harmonyBusGain: GainNode | null = null;
  private harmonyBusFilter: BiquadFilterNode | null = null;
  private textureBusGain: GainNode | null = null;
  private textureBusFilter: BiquadFilterNode | null = null;
  private delayInputGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFeedbackFilter: BiquadFilterNode | null = null;
  private delayReturnGain: GainNode | null = null;
  private reverbInputGain: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbReturnGain: GainNode | null = null;
  private tapeEchoInputGain: GainNode | null = null;
  private tapeEchoDelayNode: DelayNode | null = null;
  private tapeEchoReturnHighpass: BiquadFilterNode | null = null;
  private tapeEchoReturnLowpass: BiquadFilterNode | null = null;
  private tapeEchoFeedbackHighpass: BiquadFilterNode | null = null;
  private tapeEchoFeedbackLowpass: BiquadFilterNode | null = null;
  private tapeEchoFeedbackDrive: WaveShaperNode | null = null;
  private tapeEchoFeedbackGain: GainNode | null = null;
  private tapeEchoReturnGain: GainNode | null = null;
  private tapeEchoWowLfo: OscillatorNode | null = null;
  private tapeEchoWowDepthGain: GainNode | null = null;
  private tapeEchoSpotlightUntil = 0;
  private tapeEchoCooldownUntil = 0;
  private schedulerId: number | null = null;
  private readonly sessionSeed: string;
  private readonly supportsAudio: boolean;
  private settings: PersistedAmbientSettings;
  private preset: AmbientPreset | null = null;
  private currentTheme: AmbientTheme | null = null;
  private terrainKey: TerrainAudioKey = 'normal';
  private intensity: AmbientIntensity = 'explore';
  private random = createSeededRandom('ambient-default');
  private environmentSerial = 0;
  private nextStepTime = 0;
  private stepIndex = 0;
  private melodyDegree = 0;
  private melodyRepeatCount = 0;
  private noiseBuffer: AudioBuffer | null = null;
  private currentPhase: AmbientPhase = 'A';
  private phaseCursor = 0;
  private phaseBarsElapsed = 0;
  private rotationShift = 0;
  private variationCounter = 0;
  private melodyVariationCounter = 0;
  private rhythmVariationCounter = 0;
  private pendingRhythmTransition: PendingRhythmTransition | null = null;
  private bassRiffState: BassRiffState | null = null;
  private activeLayers: AmbientLayerPreset[] = [];
  private activeHumanRhythmIds: AmbientHumanRhythmId[] = [];
  private bpmDriftPhaseOffset = 0;
  private pendingEnvironmentTransition: PendingEnvironmentTransition | null = null;
  private layerVariantOffsets: Partial<Record<string, LayerVariantOffsets>> = {};
  private resumeBound = () => {
    void this.resume();
  };

  constructor() {
    this.supportsAudio = typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined';
    this.settings = this.supportsAudio
      ? parseSettings(window.localStorage.getItem(SETTINGS_STORAGE_KEY))
      : DEFAULT_SETTINGS;
    this.sessionSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (this.supportsAudio) {
      this.installAutoResume();
    }
  }

  getSettings(): PersistedAmbientSettings {
    return { ...this.settings };
  }

  getDebugState(): AmbientDebugState {
    return {
      settings: this.getSettings(),
      terrain: this.preset ? this.terrainKey : null,
      intensity: this.preset ? this.intensity : null,
      themeId: this.currentTheme?.id ?? null,
      isRunning: this.schedulerId !== null
    };
  }

  setEnabled(enabled: boolean): void {
    this.settings = { ...this.settings, enabled };
    this.persistSettings();

    if (!enabled) {
      this.stop(180);
      return;
    }

    if (this.preset) {
      void this.start(this.terrainKey, this.intensity);
    }
  }

  setVolume(volume: number): void {
    const nextVolume = clamp(volume, 0, 1);
    this.settings = { ...this.settings, volume: nextVolume };
    this.persistSettings();

    if (!this.masterGain || !this.context) return;
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(
      resolveAmbientOutputGain(nextVolume, this.settings.enabled),
      now + 0.18
    );
  }

  async start(terrain?: string | null, intensity: AmbientIntensity = 'explore'): Promise<void> {
    const nextTerrainKey = normalizeTerrainKey(terrain);
    const environmentSeed = `${nextTerrainKey}:${intensity}:${this.environmentSerial + 1}`;

    if (!this.supportsAudio || !this.settings.enabled) return;

    await this.ensureContext();
    if (!this.context || !this.masterGain) return;

    if (this.schedulerId !== null && this.preset) {
      const sameCurrent = nextTerrainKey === this.terrainKey && intensity === this.intensity;
      const samePending = this.pendingEnvironmentTransition
        && this.pendingEnvironmentTransition.terrainKey === nextTerrainKey
        && this.pendingEnvironmentTransition.intensity === intensity;
      if (sameCurrent || samePending) {
        return;
      }

      this.environmentSerial += 1;
      this.beginEnvironmentTransition(nextTerrainKey, intensity, environmentSeed);
      return;
    }

    this.environmentSerial += 1;
    this.configureEnvironmentState(nextTerrainKey, intensity, environmentSeed);
    if (!this.preset) return;

    this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.context.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(
      resolveAmbientOutputGain(this.settings.volume, this.settings.enabled),
      this.context.currentTime + 0.35
    );

    if (this.schedulerId === null) {
      this.schedulerId = window.setInterval(() => {
        this.tick();
      }, TICK_MS);
    }
  }

  stop(fadeOutMs = 260): void {
    if (!this.context || !this.masterGain) return;

    const fadeOutSec = Math.max(fadeOutMs / 1000, 0.05);
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeOutSec);

    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }

    if (this.pendingEnvironmentTransition) {
      this.cancelEnvironmentTransition();
    }
  }

  async resume(): Promise<void> {
    await this.ensureContext();
    if (!this.context) return;

    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch {
        return;
      }
    }
  }

  private async ensureContext(): Promise<void> {
    if (!this.supportsAudio) return;

    if (!this.context) {
      this.context = new window.AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.0001;
      this.musicBedGain = this.context.createGain();
      this.musicBedGain.gain.value = 1;
      this.tonalBusGain = this.context.createGain();
      this.tonalBusGain.gain.value = 1;
      this.rhythmBusGain = this.context.createGain();
      this.rhythmBusGain.gain.value = 1;
      this.melodyBusGain = this.context.createGain();
      this.melodyBusGain.gain.value = 1;
      this.melodyBusFilter = this.context.createBiquadFilter();
      this.melodyBusFilter.type = 'lowpass';
      this.melodyBusFilter.Q.value = 0.22;
      this.harmonyBusGain = this.context.createGain();
      this.harmonyBusGain.gain.value = 1;
      this.harmonyBusFilter = this.context.createBiquadFilter();
      this.harmonyBusFilter.type = 'lowpass';
      this.harmonyBusFilter.Q.value = 0.28;
      this.textureBusGain = this.context.createGain();
      this.textureBusGain.gain.value = 1;
      this.textureBusFilter = this.context.createBiquadFilter();
      this.textureBusFilter.type = 'lowpass';
      this.textureBusFilter.Q.value = 0.2;
      this.delayInputGain = this.context.createGain();
      this.delayInputGain.gain.value = 1;
      this.delayNode = this.context.createDelay(1.2);
      this.delayFeedbackGain = this.context.createGain();
      this.delayFeedbackGain.gain.value = 0.28;
      this.delayFeedbackFilter = this.context.createBiquadFilter();
      this.delayFeedbackFilter.type = 'lowpass';
      this.delayFeedbackFilter.frequency.value = 2200;
      this.delayReturnGain = this.context.createGain();
      this.delayReturnGain.gain.value = 0.22;
      this.reverbInputGain = this.context.createGain();
      this.reverbInputGain.gain.value = 1;
      this.reverbConvolver = this.context.createConvolver();
      this.reverbConvolver.buffer = this.createRetroImpulseBuffer(this.context);
      this.reverbReturnGain = this.context.createGain();
      this.reverbReturnGain.gain.value = 0.18;
      this.tapeEchoInputGain = this.context.createGain();
      this.tapeEchoInputGain.gain.value = TAPE_ECHO_ENABLED ? 1 : 0;
      this.tapeEchoDelayNode = this.context.createDelay(2.4);
      this.tapeEchoReturnHighpass = this.context.createBiquadFilter();
      this.tapeEchoReturnHighpass.type = 'highpass';
      this.tapeEchoReturnHighpass.frequency.value = 240;
      this.tapeEchoReturnLowpass = this.context.createBiquadFilter();
      this.tapeEchoReturnLowpass.type = 'lowpass';
      this.tapeEchoReturnLowpass.frequency.value = 1650;
      this.tapeEchoFeedbackHighpass = this.context.createBiquadFilter();
      this.tapeEchoFeedbackHighpass.type = 'highpass';
      this.tapeEchoFeedbackHighpass.frequency.value = 260;
      this.tapeEchoFeedbackLowpass = this.context.createBiquadFilter();
      this.tapeEchoFeedbackLowpass.type = 'lowpass';
      this.tapeEchoFeedbackLowpass.frequency.value = 1480;
      this.tapeEchoFeedbackDrive = this.context.createWaveShaper();
      this.tapeEchoFeedbackDrive.curve = this.createTapeEchoSaturationCurve(1.15);
      this.tapeEchoFeedbackDrive.oversample = '2x';
      this.tapeEchoFeedbackGain = this.context.createGain();
      this.tapeEchoFeedbackGain.gain.value = TAPE_ECHO_ENABLED ? TAPE_ECHO_BASE_FEEDBACK.explore : 0;
      this.tapeEchoReturnGain = this.context.createGain();
      this.tapeEchoReturnGain.gain.value = TAPE_ECHO_ENABLED ? TAPE_ECHO_BASE_RETURN.explore : 0;
      this.tapeEchoWowLfo = this.context.createOscillator();
      this.tapeEchoWowLfo.type = 'sine';
      this.tapeEchoWowLfo.frequency.value = 0.09;
      this.tapeEchoWowDepthGain = this.context.createGain();
      this.tapeEchoWowDepthGain.gain.value = 0.0024;

      this.melodyBusGain.connect(this.melodyBusFilter);
      this.melodyBusFilter.connect(this.tonalBusGain);
      this.harmonyBusGain.connect(this.harmonyBusFilter);
      this.harmonyBusFilter.connect(this.tonalBusGain);
      this.textureBusGain.connect(this.textureBusFilter);
      this.textureBusFilter.connect(this.musicBedGain);
      this.tonalBusGain.connect(this.musicBedGain);
      this.rhythmBusGain.connect(this.musicBedGain);
      this.delayInputGain.connect(this.delayNode);
      this.delayNode.connect(this.delayReturnGain);
      this.delayReturnGain.connect(this.tonalBusGain);
      this.delayNode.connect(this.delayFeedbackFilter);
      this.delayFeedbackFilter.connect(this.delayFeedbackGain);
      this.delayFeedbackGain.connect(this.delayNode);
      this.reverbInputGain.connect(this.reverbConvolver);
      this.reverbConvolver.connect(this.reverbReturnGain);
      this.reverbReturnGain.connect(this.tonalBusGain);
      this.tapeEchoInputGain.connect(this.tapeEchoDelayNode);
      this.tapeEchoDelayNode.connect(this.tapeEchoReturnHighpass);
      this.tapeEchoReturnHighpass.connect(this.tapeEchoReturnLowpass);
      this.tapeEchoReturnLowpass.connect(this.tapeEchoReturnGain);
      this.tapeEchoReturnGain.connect(this.masterGain);
      this.tapeEchoDelayNode.connect(this.tapeEchoFeedbackHighpass);
      this.tapeEchoFeedbackHighpass.connect(this.tapeEchoFeedbackLowpass);
      this.tapeEchoFeedbackLowpass.connect(this.tapeEchoFeedbackDrive);
      this.tapeEchoFeedbackDrive.connect(this.tapeEchoFeedbackGain);
      this.tapeEchoFeedbackGain.connect(this.tapeEchoDelayNode);
      this.tapeEchoWowLfo.connect(this.tapeEchoWowDepthGain);
      this.tapeEchoWowDepthGain.connect(this.tapeEchoDelayNode.delayTime);
      this.tapeEchoWowLfo.start();
      this.musicBedGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer(this.context);
      this.resetFxBusFilters();
    }

    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch {
        // Browsers can reject resume before first gesture. Auto-resume listeners will retry.
      }
    }
  }

  private installAutoResume(): void {
    window.addEventListener('pointerdown', this.resumeBound, { passive: true });
    window.addEventListener('keydown', this.resumeBound);
    window.addEventListener('touchstart', this.resumeBound, { passive: true });
  }

  private persistSettings(): void {
    if (!this.supportsAudio) return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
  }

  private configureEnvironmentState(
    terrainKey: TerrainAudioKey,
    intensity: AmbientIntensity,
    environmentSeed = `${terrainKey}:${intensity}:${this.environmentSerial}`
  ): void {
    if (!this.context) return;

    this.terrainKey = terrainKey;
    this.intensity = intensity;
    this.preset = resolveAmbientPreset(this.terrainKey);
    if (!this.preset) return;

    this.currentTheme = selectAmbientTheme(
      this.terrainKey,
      this.intensity,
      createSeededRandom(`${this.sessionSeed}:${environmentSeed}:theme`)
    );
    this.random = createSeededRandom(`${this.sessionSeed}:${environmentSeed}:arrangement`);
    this.stepIndex = 0;
    this.nextStepTime = this.context.currentTime + 0.05;
    this.melodyDegree = Math.floor(this.random() * this.preset.scaleIntervals.length);
    this.melodyRepeatCount = 0;
    this.phaseCursor = 0;
    this.currentPhase = PHASE_ORDER[this.phaseCursor];
    this.phaseBarsElapsed = 0;
    this.rotationShift = 0;
    this.variationCounter = 0;
    this.melodyVariationCounter = 0;
    this.rhythmVariationCounter = 0;
    this.pendingRhythmTransition = null;
    this.bpmDriftPhaseOffset = (this.random() - 0.5) * (Math.PI / 2);
    this.bassRiffState = null;
    this.initializeLayerVariantOffsets();
    this.activeLayers = this.selectActiveLayers([]);
    this.activeHumanRhythmIds = this.selectActiveHumanRhythms([]);
    this.syncMusicalFxToTempo();
    this.resetFxBusFilters();
    this.resetTapeEchoSpotlight();
  }

  private previewEnvironmentSelection(
    terrainKey: TerrainAudioKey,
    intensity: AmbientIntensity,
    environmentSeed: string
  ): {
    preset: AmbientPreset;
    theme: AmbientTheme | null;
    activeLayers: AmbientLayerPreset[];
    activeHumanRhythmIds: AmbientHumanRhythmId[];
  } {
    const previousPreset = this.preset;
    const previousTerrainKey = this.terrainKey;
    const previousIntensity = this.intensity;
    const previousRandom = this.random;
    const previousTheme = this.currentTheme;
    const previousActiveLayers = this.activeLayers;
    const previousActiveHumanRhythmIds = this.activeHumanRhythmIds;

    const previewPreset = resolveAmbientPreset(terrainKey);
    this.preset = previewPreset;
    this.terrainKey = terrainKey;
    this.intensity = intensity;
    this.currentTheme = selectAmbientTheme(
      terrainKey,
      intensity,
      createSeededRandom(`${this.sessionSeed}:${environmentSeed}:theme`)
    );
    this.random = createSeededRandom(`${this.sessionSeed}:${environmentSeed}:transition-preview`);
    this.activeLayers = this.selectActiveLayers([]);
    this.activeHumanRhythmIds = this.selectActiveHumanRhythms([]);

    const previewTheme = this.currentTheme;
    const previewLayers = [...this.activeLayers];
    const previewHumanRhythmIds = [...this.activeHumanRhythmIds];

    this.preset = previousPreset;
    this.terrainKey = previousTerrainKey;
    this.intensity = previousIntensity;
    this.random = previousRandom;
    this.currentTheme = previousTheme;
    this.activeLayers = previousActiveLayers;
    this.activeHumanRhythmIds = previousActiveHumanRhythmIds;

    return {
      preset: previewPreset,
      theme: previewTheme,
      activeLayers: previewLayers,
      activeHumanRhythmIds: previewHumanRhythmIds
    };
  }

  private beginEnvironmentTransition(
    terrainKey: TerrainAudioKey,
    intensity: AmbientIntensity,
    environmentSeed: string
  ): void {
    if (!this.context || !this.preset) {
      this.configureEnvironmentState(terrainKey, intensity, environmentSeed);
      return;
    }

    const preview = this.previewEnvironmentSelection(terrainKey, intensity, environmentSeed);

    this.pendingEnvironmentTransition = {
      sourceTerrainKey: this.terrainKey,
      sourceIntensity: this.intensity,
      sourcePreset: this.preset,
      sourceRandom: this.random,
      sourceTheme: this.currentTheme,
      sourceBpmDriftPhaseOffset: this.bpmDriftPhaseOffset,
      terrainKey,
      intensity,
      targetPreset: preview.preset,
      targetTheme: preview.theme,
      startLayers: [...this.activeLayers],
      targetLayers: preview.activeLayers,
      startHumanRhythmIds: [...this.activeHumanRhythmIds],
      targetHumanRhythmIds: preview.activeHumanRhythmIds,
      startStep: this.stepIndex,
      endStep: this.stepIndex + ENVIRONMENT_TRANSITION_STEPS,
      lastLayerSwapCount: 0,
      lastHumanRhythmSwapCount: 0
    };

    this.terrainKey = terrainKey;
    this.intensity = intensity;
    this.preset = preview.preset;
    this.currentTheme = preview.theme;
    this.random = createSeededRandom(`${this.sessionSeed}:${environmentSeed}:transition-live`);
    this.bpmDriftPhaseOffset = (this.random() - 0.5) * (Math.PI / 2);
    this.syncMusicalFxToTempo(this.stepIndex);
    this.resetFxBusFilters();
  }

  private cancelEnvironmentTransition(): void {
    if (this.pendingEnvironmentTransition) {
      this.terrainKey = this.pendingEnvironmentTransition.sourceTerrainKey;
      this.intensity = this.pendingEnvironmentTransition.sourceIntensity;
      this.preset = this.pendingEnvironmentTransition.sourcePreset;
      this.random = this.pendingEnvironmentTransition.sourceRandom;
      this.currentTheme = this.pendingEnvironmentTransition.sourceTheme;
      this.bpmDriftPhaseOffset = this.pendingEnvironmentTransition.sourceBpmDriftPhaseOffset;
      this.activeLayers = [...this.pendingEnvironmentTransition.startLayers];
      this.activeHumanRhythmIds = [...this.pendingEnvironmentTransition.startHumanRhythmIds];
      this.syncMusicalFxToTempo(this.stepIndex);
      this.resetFxBusFilters();
    }
    this.pendingEnvironmentTransition = null;
  }

  private maybeAdvanceEnvironmentTransition(stepIndex: number): void {
    if (!this.pendingEnvironmentTransition) return;

    const transition = this.pendingEnvironmentTransition;
    const elapsedSteps = Math.max(0, stepIndex - transition.startStep);
    const completedSwapWindows = Math.floor(elapsedSteps / ENVIRONMENT_TRANSITION_SWAP_INTERVAL_STEPS);

    const nextLayerSwapCount = this.resolveTransitionSwapCount(
      transition.startLayers.map((layer) => layer.id),
      transition.targetLayers.map((layer) => layer.id),
      completedSwapWindows
    );
    if (nextLayerSwapCount !== transition.lastLayerSwapCount) {
      this.activeLayers = this.buildLayerTransitionBlend(
        transition.startLayers,
        transition.targetLayers,
        nextLayerSwapCount
      );
      transition.lastLayerSwapCount = nextLayerSwapCount;
    }

    const nextHumanRhythmSwapCount = this.resolveTransitionSwapCount(
      transition.startHumanRhythmIds,
      transition.targetHumanRhythmIds,
      completedSwapWindows
    );
    if (nextHumanRhythmSwapCount !== transition.lastHumanRhythmSwapCount) {
      this.activeHumanRhythmIds = this.buildIdTransitionBlend(
        transition.startHumanRhythmIds,
        transition.targetHumanRhythmIds,
        nextHumanRhythmSwapCount
      );
      transition.lastHumanRhythmSwapCount = nextHumanRhythmSwapCount;
    }

    if (stepIndex >= transition.endStep) {
      this.completeEnvironmentTransition(transition);
    }
  }

  private tick(): void {
    if (!this.context || !this.preset || !this.masterGain) return;
    if (this.context.state !== 'running') return;

    this.maybeAdvanceEnvironmentTransition(this.stepIndex);
    this.maybeAdvanceRhythmTransition(this.stepIndex);

    while (this.nextStepTime < this.context.currentTime + LOOKAHEAD_SEC) {
      const stepDuration = this.getCurrentStepDuration(this.stepIndex);
      this.advanceArrangementIfNeeded(this.stepIndex);
      this.scheduleStep(this.stepIndex, this.nextStepTime);
      this.stepIndex += 1;
      this.maybeAdvanceEnvironmentTransition(this.stepIndex);
      this.maybeAdvanceRhythmTransition(this.stepIndex);
      this.nextStepTime += stepDuration;
    }
  }

  private maybeAdvanceRhythmTransition(stepIndex: number): void {
    if (!this.pendingRhythmTransition) return;
    if (stepIndex < this.pendingRhythmTransition.endStep) return;

    this.rhythmVariationCounter = this.pendingRhythmTransition.toCounter;
    this.rotationShift = this.pendingRhythmTransition.toRotationShift;
    this.pendingRhythmTransition = null;
  }

  private getThemeTimbreVariationBars(): number {
    return Math.max(4, this.currentTheme?.timbreVariationBars ?? 4);
  }

  private getThemeMelodyVariationBars(): number {
    return Math.max(8, this.currentTheme?.melodyVariationBars ?? MELODY_VARIATION_BARS[this.intensity]);
  }

  private getThemeRhythmVariationBars(): number {
    return Math.max(4, this.currentTheme?.rhythmVariationBars ?? RHYTHM_VARIATION_BARS[this.intensity]);
  }

  private getThemeRhythmRotationBars(): number {
    return Math.max(4, this.currentTheme?.rhythmRotationBars ?? RHYTHM_ROTATION_BARS[this.intensity]);
  }

  private resolveActiveDensity(): AmbientDensityRange {
    if (!this.preset) {
      return { min: 0, max: 0 };
    }

    return this.currentTheme?.density ?? this.preset.density[this.intensity];
  }

  private resolveActiveAnchorLayerIds(): AmbientLayerId[] {
    return this.currentTheme?.anchorLayers?.length
      ? this.currentTheme.anchorLayers
      : ANCHOR_LAYER_IDS[this.intensity];
  }

  private resolveActiveFamilyCaps(): Record<AmbientLayerFamily, number> {
    const baseCaps = FAMILY_CAPS[this.intensity];
    return {
      rhythm: this.currentTheme?.familyCaps?.rhythm ?? baseCaps.rhythm,
      low: this.currentTheme?.familyCaps?.low ?? baseCaps.low,
      harmony: this.currentTheme?.familyCaps?.harmony ?? baseCaps.harmony,
      melody: this.currentTheme?.familyCaps?.melody ?? baseCaps.melody,
      texture: this.currentTheme?.familyCaps?.texture ?? baseCaps.texture
    };
  }

  private isLayerEnabledForTheme(layer: AmbientLayerPreset): boolean {
    if (!this.currentTheme) {
      return true;
    }

    if (this.currentTheme.blockedLayers?.includes(layer.id)) {
      return false;
    }

    if (this.currentTheme.allowedLayers?.length) {
      return this.currentTheme.allowedLayers.includes(layer.id);
    }

    return true;
  }

  private resolveThemeLayerWeight(layer: AmbientLayerPreset): number {
    const multiplier = this.currentTheme?.layerWeightMultipliers?.[layer.id] ?? 1;
    return Math.max(0.05, layer.weight * multiplier);
  }

  private pickLayerVariant<T>(
    variants: T[] | undefined,
    lockedIndex: number | undefined,
    index: number
  ): T | undefined {
    if (!variants?.length) {
      return undefined;
    }

    const safeIndex = typeof lockedIndex === 'number'
      ? ((lockedIndex % variants.length) + variants.length) % variants.length
      : ((index % variants.length) + variants.length) % variants.length;

    return variants[safeIndex];
  }

  private advanceArrangementIfNeeded(stepIndex: number): void {
    if (!this.preset || stepIndex === 0 || stepIndex % STEPS_PER_BAR !== 0) return;

    this.maybeUpdateBassRiff(stepIndex);

    const isTimbreBoundary = stepIndex % (STEPS_PER_BAR * this.getThemeTimbreVariationBars()) === 0;
    if (isTimbreBoundary) {
      this.variationCounter += this.random() > 0.7 ? 2 : 1;
    }

    const isMelodyVariationBoundary = stepIndex % (STEPS_PER_BAR * this.getThemeMelodyVariationBars()) === 0;
    if (isMelodyVariationBoundary) {
      this.melodyVariationCounter += 1;
    }

    const isRhythmRotationBoundary = stepIndex % (STEPS_PER_BAR * this.getThemeRhythmRotationBars()) === 0;
    const isRhythmVariationBoundary = stepIndex % (STEPS_PER_BAR * this.getThemeRhythmVariationBars()) === 0;
    if (!this.pendingRhythmTransition && (isRhythmRotationBoundary || isRhythmVariationBoundary)) {
      const nextRotationShift = isRhythmRotationBoundary && this.random() > 0.42
        ? Math.floor(this.random() * 4)
        : this.rotationShift;
      const nextRhythmVariationCounter = isRhythmVariationBoundary && this.random() > 0.28
        ? this.rhythmVariationCounter + 1
        : this.rhythmVariationCounter;

      if (nextRotationShift !== this.rotationShift || nextRhythmVariationCounter !== this.rhythmVariationCounter) {
        this.pendingRhythmTransition = {
          fromCounter: this.rhythmVariationCounter,
          toCounter: nextRhythmVariationCounter,
          fromRotationShift: this.rotationShift,
          toRotationShift: nextRotationShift,
          startStep: stepIndex,
          endStep: stepIndex + RHYTHM_TRANSITION_STEPS
        };
      }
    }

    if (stepIndex % (STEPS_PER_BAR * 4) === 0) {
      this.syncMusicalFxToTempo(stepIndex);
    }

    if (this.pendingEnvironmentTransition) {
      return;
    }

    this.phaseBarsElapsed += 1;
    if (this.phaseBarsElapsed < PHASE_BARS[this.intensity][this.currentPhase]) {
      return;
    }

    const previousLayers = this.activeLayers;
    const previousHumanRhythmIds = this.activeHumanRhythmIds;
    const previousPhase = this.currentPhase;
    this.phaseCursor = (this.phaseCursor + 1) % PHASE_ORDER.length;
    this.currentPhase = PHASE_ORDER[this.phaseCursor];
    this.phaseBarsElapsed = 0;
    this.activeLayers = this.selectActiveLayers(previousLayers);
    this.activeHumanRhythmIds = this.selectActiveHumanRhythms(previousHumanRhythmIds);
    this.triggerPhaseMusicalFx(previousPhase, this.currentPhase);
  }

  private scheduleStep(stepIndex: number, time: number): void {
    if (!this.context || !this.preset) return;

    this.activeLayers.forEach((layer) => {
      const runtime = this.resolveLayerRuntime(layer);
      if (layer.id === 'bass' && this.scheduleBassRiffStepIfNeeded(layer, runtime, stepIndex, time)) {
        return;
      }

      if (this.pendingRhythmTransition) {
        this.scheduleLayerDuringRhythmTransition(layer, stepIndex, time);
        return;
      }

      const pattern = this.buildLayerPattern(layer, runtime, this.rotationShift);
      if (!pattern[stepIndex % pattern.length]) return;
      if (this.random() > runtime.probability) return;
      this.scheduleLayer(layer, runtime, this.resolveAccentStep(layer, runtime, stepIndex), stepIndex, time);
    });
  }

  private scheduleLayerDuringRhythmTransition(
    layer: AmbientLayerPreset,
    stepIndex: number,
    time: number
  ): void {
    const transition = this.pendingRhythmTransition;
    if (!transition) return;

    const fromRuntime = this.resolveLayerRuntime(layer, transition.fromCounter);
    const toRuntime = this.resolveLayerRuntime(layer, transition.toCounter);
    const progress = clamp((stepIndex - transition.startStep) / Math.max(1, transition.endStep - transition.startStep), 0, 1);
    const fromPattern = this.buildLayerPattern(layer, fromRuntime, transition.fromRotationShift);
    const toPattern = this.buildLayerPattern(layer, toRuntime, transition.toRotationShift);
    const fromHit = fromPattern[stepIndex % fromPattern.length];
    const toHit = toPattern[stepIndex % toPattern.length];

    let runtimeToSchedule: ResolvedLayerRuntime | null = null;
    if (fromHit && toHit) {
      runtimeToSchedule = this.random() < progress ? toRuntime : fromRuntime;
    } else if (fromHit && this.random() > progress) {
      runtimeToSchedule = fromRuntime;
    } else if (toHit && this.random() < progress) {
      runtimeToSchedule = toRuntime;
    }

    if (!runtimeToSchedule) return;
    if (this.random() > runtimeToSchedule.probability) return;

    this.scheduleLayer(
      layer,
      runtimeToSchedule,
      this.resolveAccentStep(layer, runtimeToSchedule, stepIndex),
      stepIndex,
      time
    );
  }

  private buildLayerPattern(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    rotationShift: number
  ): boolean[] {
    return runtime.humanPattern ?? rotatePattern(
      this.resolveMirrorPattern(layer, runtime, buildEuclideanPattern(runtime.pulses, runtime.steps)),
      runtime.rotation + rotationShift
    );
  }

  private resolveMirrorPattern(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    pattern: boolean[]
  ): boolean[] {
    if (!MIRROR_ENABLED_PHASES.includes(this.currentPhase)) {
      return pattern;
    }

    const mirrorMode = runtime.mirrorMode;
    if (!mirrorMode || mirrorMode === 'none') {
      return pattern;
    }

    if (layer.family === 'rhythm' || layer.id === 'bass' || layer.id === 'subPiano' || layer.id === 'kick') {
      return pattern;
    }

    return this.applyMirrorPattern(pattern, mirrorMode);
  }

  private applyMirrorPattern(pattern: boolean[], mode: AmbientMirrorMode): boolean[] {
    if (pattern.length <= 1) {
      return pattern;
    }

    switch (mode) {
      case 'full':
        return [...pattern, ...[...pattern].reverse()];
      case 'center-repeat':
        return [...pattern, pattern[pattern.length - 1], ...[...pattern].slice(0, -1).reverse()];
      case 'center-gap':
        return [...pattern, false, ...[...pattern].reverse()];
      case 'none':
      default:
        return pattern;
    }
  }

  private maybeUpdateBassRiff(stepIndex: number): void {
    if (this.bassRiffState && stepIndex >= this.bassRiffState.startStep + this.bassRiffState.totalSteps) {
      this.bassRiffState = null;
    }

    if (this.bassRiffState) return;
    if (this.currentPhase === 'break') return;
    if (!this.activeLayers.some((layer) => layer.id === 'bass')) return;
    if (this.random() > BASS_RIFF_CHANCE[this.intensity]) return;

    const template = pickRandom(BASS_RIFF_TEMPLATES, this.random);
    const totalSteps = template.durations.reduce((sum, duration) => sum + duration, 0);
    this.bassRiffState = {
      startStep: stepIndex,
      totalSteps,
      template
    };
  }

  private scheduleBassRiffStepIfNeeded(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    stepIndex: number,
    time: number
  ): boolean {
    if (!this.preset || !this.bassRiffState) return false;

    const localStep = stepIndex - this.bassRiffState.startStep;
    if (localStep < 0 || localStep >= this.bassRiffState.totalSteps) {
      return false;
    }

    let onsetStep = 0;
    for (let index = 0; index < this.bassRiffState.template.durations.length; index += 1) {
      const durationSteps = this.bassRiffState.template.durations[index];
      if (localStep === onsetStep) {
        this.scheduleBassRiffNote(layer, runtime, time, this.bassRiffState.template.degrees[index], durationSteps);
        return true;
      }

      onsetStep += durationSteps;
    }

    return true;
  }

  private selectActiveLayers(previous: AmbientLayerPreset[]): AmbientLayerPreset[] {
    if (!this.preset) return [];

    const candidates = this.preset.layers.filter((layer) => (
      layer.intensities.includes(this.intensity)
      && layer.phases.includes(this.currentPhase)
      && this.isLayerEnabledForTheme(layer)
    ));

    if (candidates.length === 0) return [];

    const density = this.resolveActiveDensity();
    const anchorIds = this.resolveActiveAnchorLayerIds();
    const anchorCandidates = candidates.filter((layer) => anchorIds.includes(layer.id));
    const targetCount = Math.min(
      candidates.length,
      Math.max(
        anchorCandidates.length,
        density.min + Math.floor(this.random() * (density.max - density.min + 1))
      )
    );

    const familyCaps = this.resolveActiveFamilyCaps();
    const familyCounts: Record<AmbientLayerFamily, number> = {
      rhythm: 0,
      low: 0,
      harmony: 0,
      melody: 0,
      texture: 0
    };
    const selectedIds = new Set<string>();
    const selectedGroups = new Set<string>();
    const selected: AmbientLayerPreset[] = [];

    const trySelect = (layer: AmbientLayerPreset, ignoreFamilyCap = false): boolean => {
      if (selectedIds.has(layer.id)) return false;
      if (layer.exclusiveGroup && selectedGroups.has(layer.exclusiveGroup)) return false;
      if (!ignoreFamilyCap && familyCounts[layer.family] >= familyCaps[layer.family]) return false;

      selected.push(layer);
      selectedIds.add(layer.id);
      familyCounts[layer.family] += 1;
      if (layer.exclusiveGroup) {
        selectedGroups.add(layer.exclusiveGroup);
      }
      return true;
    };

    const previousEligible = previous.filter((layer) => (
      layer.intensities.includes(this.intensity) && layer.phases.includes(this.currentPhase)
    ));

    anchorIds.forEach((anchorId) => {
      const anchor = candidates.find((layer) => layer.id === anchorId);
      if (!anchor) return;
      trySelect(anchor);
    });

    for (const layer of this.weightedOrder(previousEligible)) {
      if (selected.length >= Math.min(targetCount, CARRY_LIMIT[this.intensity])) break;
      if (this.random() > 0.68) continue;
      trySelect(layer);
    }

    for (const layer of this.weightedOrder(candidates)) {
      if (selected.length >= targetCount) break;
      trySelect(layer);
    }

    if (selected.length < density.min) {
      for (const layer of this.weightedOrder(candidates)) {
        if (selected.length >= density.min) break;
        trySelect(layer, true);
      }
    }

    return selected;
  }

  private weightedOrder(layers: AmbientLayerPreset[]): AmbientLayerPreset[] {
    return [...layers]
      .map((layer) => ({
        layer,
        rank: -Math.log(Math.max(this.random(), 0.0001)) / this.resolveThemeLayerWeight(layer)
      }))
      .sort((left, right) => left.rank - right.rank)
      .map(({ layer }) => layer);
  }

  private resolveTransitionSwapCount(currentIds: string[], targetIds: string[], completedSwapWindows: number): number {
    const currentSet = new Set(currentIds);
    const targetSet = new Set(targetIds);
    const currentOnly = currentIds.filter((id) => !targetSet.has(id));
    const targetOnly = targetIds.filter((id) => !currentSet.has(id));
    const totalSlots = Math.max(currentOnly.length, targetOnly.length);

    if (totalSlots === 0) {
      return 0;
    }

    return Math.min(totalSlots, completedSwapWindows);
  }

  private buildLayerTransitionBlend(
    startLayers: AmbientLayerPreset[],
    targetLayers: AmbientLayerPreset[],
    swapCount: number
  ): AmbientLayerPreset[] {
    const targetIds = new Set(targetLayers.map((layer) => layer.id));
    const startIds = new Set(startLayers.map((layer) => layer.id));
    const shared = startLayers.filter((layer) => targetIds.has(layer.id));
    const startOnly = startLayers.filter((layer) => !targetIds.has(layer.id));
    const targetOnly = targetLayers.filter((layer) => !startIds.has(layer.id));
    const oldRemaining = startOnly.slice(swapCount);
    const incoming = targetOnly.slice(0, Math.min(swapCount, targetOnly.length));

    return [...shared, ...oldRemaining, ...incoming];
  }

  private buildIdTransitionBlend<T extends string>(currentIds: T[], targetIds: T[], swapCount: number): T[] {
    const targetSet = new Set(targetIds);
    const currentSet = new Set(currentIds);
    const shared = currentIds.filter((id) => targetSet.has(id));
    const currentOnly = currentIds.filter((id) => !targetSet.has(id));
    const targetOnly = targetIds.filter((id) => !currentSet.has(id));
    const oldRemaining = currentOnly.slice(swapCount);
    const incoming = targetOnly.slice(0, Math.min(swapCount, targetOnly.length));

    return [...shared, ...oldRemaining, ...incoming];
  }

  private completeEnvironmentTransition(transition: PendingEnvironmentTransition): void {
    this.pendingEnvironmentTransition = null;
    this.currentTheme = transition.targetTheme;
    this.activeLayers = transition.targetLayers;
    this.activeHumanRhythmIds = transition.targetHumanRhythmIds;
    this.syncMusicalFxToTempo(this.stepIndex);
  }

  private selectActiveHumanRhythms(previous: AmbientHumanRhythmId[]): AmbientHumanRhythmId[] {
    if (!this.preset || this.activeLayers.length === 0) {
      return [];
    }

    const candidateIds = Array.from(new Set(
      this.activeLayers.flatMap((layer) => layer.humanRhythmIds ?? [])
    ));
    const themedCandidateIds = this.currentTheme?.preferredHumanRhythms?.length
      ? candidateIds.filter((id) => this.currentTheme?.preferredHumanRhythms?.includes(id))
      : candidateIds;
    const activeCandidateIds = themedCandidateIds.length > 0 ? themedCandidateIds : candidateIds;
    const candidates = activeCandidateIds
      .map((id) => getHumanRhythmPattern(id))
      .filter((pattern) => (
        pattern.intensities.includes(this.intensity) &&
        pattern.phases.includes(this.currentPhase)
      ));

    if (candidates.length === 0) {
      return [];
    }

    const density = HUMAN_RHYTHM_DENSITY[this.intensity];
    const maxCount = this.currentPhase === 'break' ? Math.min(1, density.max) : density.max;
    const minCount = Math.min(density.min, maxCount);
    const targetCount = Math.min(
      candidates.length,
      maxCount <= minCount ? minCount : minCount + Math.floor(this.random() * (maxCount - minCount + 1))
    );

    if (targetCount === 0) {
      return [];
    }

    const candidateById = new Map(candidates.map((pattern) => [pattern.id, pattern]));
    const selected: AmbientHumanRhythmId[] = [];
    const selectedFamilies = new Set<string>();

    previous.forEach((id) => {
      const pattern = candidateById.get(id);
      if (!pattern || selected.length >= targetCount) return;
      if (selectedFamilies.has(pattern.family) || this.random() > 0.46) return;
      selected.push(id);
      selectedFamilies.add(pattern.family);
    });

    for (const pattern of this.weightedOrderHumanRhythms(candidates)) {
      if (selected.length >= targetCount) break;
      if (selected.includes(pattern.id)) continue;
      if (selectedFamilies.has(pattern.family)) continue;
      selected.push(pattern.id);
      selectedFamilies.add(pattern.family);
    }

    return selected;
  }

  private weightedOrderHumanRhythms(patterns: HumanRhythmPattern[]): HumanRhythmPattern[] {
    return [...patterns]
      .map((pattern) => ({
        pattern,
        rank: -Math.log(Math.max(this.random(), 0.0001)) / Math.max(pattern.weight, 0.05)
      }))
      .sort((left, right) => left.rank - right.rank)
      .map(({ pattern }) => pattern);
  }

  private initializeLayerVariantOffsets(): void {
    if (!this.preset) return;

    this.layerVariantOffsets = {};
    this.preset.layers.forEach((layer) => {
      this.layerVariantOffsets[layer.id] = {
        rhythm: layer.rhythmVariants?.length ? Math.floor(this.random() * layer.rhythmVariants.length) : 0,
        accent: layer.accentVariants?.length ? Math.floor(this.random() * layer.accentVariants.length) : 0,
        mirror: layer.mirrorVariants?.length ? Math.floor(this.random() * layer.mirrorVariants.length) : 0,
        degree: layer.degreeVariants?.length ? Math.floor(this.random() * layer.degreeVariants.length) : 0,
        filter: Math.floor(this.random() * 4),
        generator: layer.generatorVariants?.length ? Math.floor(this.random() * layer.generatorVariants.length) : 0
      };
    });
  }

  private usesSlowMelodicVariation(layer: AmbientLayerPreset): boolean {
    return layer.family === 'melody'
      || layer.id === 'arp'
      || layer.id === 'chord'
      || layer.id === 'vocalOoh'
      || layer.id === 'vocalAah'
      || layer.id === 'vocalAir';
  }

  private getLayerVariationCounter(layer: AmbientLayerPreset): number {
    return this.usesSlowMelodicVariation(layer) ? this.melodyVariationCounter : this.variationCounter;
  }

  private resolveActiveHumanRhythmLane(
    layer: AmbientLayerPreset
  ): { pattern: HumanRhythmPattern; lane: HumanRhythmLane } | null {
    if (!layer.humanRhythmIds?.length || this.activeHumanRhythmIds.length === 0) {
      return null;
    }

    for (const id of this.activeHumanRhythmIds) {
      if (!layer.humanRhythmIds.includes(id)) continue;
      const pattern = getHumanRhythmPattern(id);
      const lane = pattern.lanes[layer.id];
      if (lane) {
        return { pattern, lane };
      }
    }

    return null;
  }

  private countPatternPulses(pattern: boolean[]): number {
    return pattern.reduce((count, isActive) => count + (isActive ? 1 : 0), 0);
  }

  private resolveLayerRuntime(
    layer: AmbientLayerPreset,
    rhythmVariationCounterOverride = this.rhythmVariationCounter
  ): ResolvedLayerRuntime {
    const offsets = this.layerVariantOffsets[layer.id] ?? { rhythm: 0, accent: 0, mirror: 0, degree: 0, filter: 0, generator: 0 };
    const layerVariationCounter = this.getLayerVariationCounter(layer);
    const lockedRhythmIndex = this.currentTheme?.lockedRhythmVariants?.[layer.id];
    const lockedAccentIndex = this.currentTheme?.lockedAccentVariants?.[layer.id];
    const lockedMirrorIndex = this.currentTheme?.lockedMirrorVariants?.[layer.id];
    const lockedDegreeIndex = this.currentTheme?.lockedDegreeVariants?.[layer.id];
    const lockedGeneratorIndex = this.currentTheme?.lockedGeneratorVariants?.[layer.id];
    const rhythmVariant = this.pickLayerVariant(
      layer.rhythmVariants,
      lockedRhythmIndex,
      rhythmVariationCounterOverride + offsets.rhythm
    );
    const accentPattern = this.pickLayerVariant(
      layer.accentVariants,
      lockedAccentIndex,
      rhythmVariationCounterOverride + offsets.accent
    );
    const mirrorMode = this.pickLayerVariant(
      layer.mirrorVariants,
      lockedMirrorIndex,
      rhythmVariationCounterOverride + offsets.mirror
    );
    const degreePattern = this.pickLayerVariant(
      layer.degreeVariants,
      lockedDegreeIndex,
      layerVariationCounter + offsets.degree
    );
    const generator = this.pickLayerVariant(
      layer.generatorVariants,
      lockedGeneratorIndex,
      layerVariationCounter + offsets.generator
    );
    const humanRhythm = this.resolveActiveHumanRhythmLane(layer);

    const baseFilterHz = rhythmVariant?.filterHz ?? layer.filterHz;
    const filterOffset = this.resolveMediumFilterOffset(layer, offsets.filter, layerVariationCounter) + (generator?.filterOffset ?? 0);
    const humanLane = humanRhythm?.lane;

    return {
      steps: humanLane?.pattern.length ?? rhythmVariant?.steps ?? layer.steps,
      pulses: humanLane ? this.countPatternPulses(humanLane.pattern) : rhythmVariant?.pulses ?? layer.pulses,
      rotation: humanLane ? 0 : rhythmVariant?.rotation ?? layer.rotation,
      probability: humanLane?.probability ?? rhythmVariant?.probability ?? layer.probability,
      durationSteps: humanLane?.durationSteps ?? rhythmVariant?.durationSteps ?? layer.durationSteps,
      octaveOffset: humanLane?.octaveOffset ?? rhythmVariant?.octaveOffset ?? layer.octaveOffset,
      filterHz: typeof baseFilterHz === 'number'
        ? Math.max(120, baseFilterHz + filterOffset + (humanLane?.filterOffset ?? 0))
        : undefined,
      accentPattern: humanLane?.accents ?? accentPattern,
      mirrorMode,
      degreePattern,
      generator,
      humanPattern: humanLane?.pattern,
      humanRhythmId: humanRhythm?.pattern.id
    };
  }

  private resolveMediumFilterOffset(layer: AmbientLayerPreset, seedOffset: number, layerVariationCounter: number): number {
    if (layer.family !== 'melody' && layer.family !== 'harmony') {
      if (layer.family === 'low') {
        return [-60, 0, 40][(this.variationCounter + seedOffset) % 3];
      }
      return 0;
    }

    return [-220, -80, 120, 260][(layerVariationCounter + seedOffset) % 4];
  }

  private scheduleLayer(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    stepIndex: number,
    time: number
  ): void {
    if (!this.context || !this.masterGain || !this.preset) return;

    switch (layer.id) {
      case 'kick':
        this.scheduleKick(layer, runtime, accent, time);
        return;
      case 'snare':
        this.scheduleSnare(layer, runtime, accent, time);
        return;
      case 'hat':
        this.scheduleHat(layer, runtime, accent, time);
        return;
      case 'wind':
        this.scheduleWind(layer, runtime, accent, time);
        return;
      case 'subPiano':
        this.scheduleSubPiano(layer, runtime, accent, stepIndex, time);
        return;
      case 'chord':
        this.scheduleChord(layer, runtime, accent, stepIndex, time);
        return;
      case 'guitar':
        this.scheduleGuitar(layer, runtime, accent, stepIndex, time);
        return;
      case 'hangpan':
        this.scheduleHangpan(layer, runtime, accent, stepIndex, time);
        return;
      case 'arp':
        this.scheduleArp(layer, runtime, accent, stepIndex, time);
        return;
      case 'vocalOoh':
      case 'vocalAah':
      case 'vocalAir':
        this.scheduleVocalChord(layer, runtime, accent, stepIndex, time);
        return;
      case 'lead':
      case 'bass':
      default:
        this.scheduleTone(layer, runtime, accent, stepIndex, time);
    }
  }

  private scheduleTone(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    stepIndex: number,
    time: number
  ): void {
    if (!this.preset) return;

    const duration = this.getCurrentStepDuration(stepIndex) * runtime.durationSteps * accent.durationScale;
    const gain = layer.gain * (0.88 + this.random() * 0.24) * accent.gainScale;
    const midi = this.resolveMidi(layer, runtime, stepIndex);
    const outputNode = this.resolveLayerOutputNode(layer);

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent,
      frequencies: this.resolveMediumHarmonyFrequencies(layer, runtime, midi),
      time,
      duration,
      voice: layer.voice,
      gain,
      filterType: 'lowpass',
      filterHz: (runtime.filterHz ?? (layer.voice === 'triangle' ? 1100 : 1800)) * accent.filterScale,
      attack: 0.012 * accent.attackScale,
      outputNode
    });
  }

  private scheduleBassRiffNote(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    time: number,
    degree: number,
    durationSteps: number
  ): void {
    if (!this.preset) return;

    const riff = this.bassRiffState;
    if (!riff) return;

    const root = this.preset.rootMidi + ((runtime.octaveOffset ?? 0) + riff.template.octaveOffset) * 12;
    const midi = this.scaleDegreeToMidi(root, degree);
    const duration = this.getCurrentStepDuration() * durationSteps * 1.12;
    const outputNode = this.resolveLayerOutputNode(layer);

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent: NEUTRAL_ACCENT_STEP,
      frequencies: [midiToFrequency(midi)],
      time,
      duration,
      voice: layer.voice,
      gain: layer.gain * riff.template.gainScale,
      filterType: 'lowpass',
      filterHz: Math.max(180, (runtime.filterHz ?? 720) - 40),
      attack: 0.02,
      outputNode
    });
  }

  private scheduleKick(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    time: number
  ): void {
    if (!this.context || !this.rhythmBusGain) return;

    const generator = runtime.generator;
    const duration = Math.max(0.07, 0.11 * (generator?.durationScale ?? 1) * accent.durationScale);
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const oscillator = this.context.createOscillator();
    const gain = layer.gain * (0.9 + this.random() * 0.2) * (generator?.gainScale ?? 1) * accent.gainScale;
    const attack = Math.max(0.002, 0.008 * (generator?.attackScale ?? 1) * accent.attackScale);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(132 * (generator?.pitchStartMultiplier ?? 1), time);
    oscillator.frequency.exponentialRampToValueAtTime(42 * (generator?.pitchEndMultiplier ?? 1), time + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime((runtime.filterHz ?? 220) * accent.filterScale, time);

    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), time + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.rhythmBusGain);

    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);

    this.scheduleKickSidechain(time);
  }

  private scheduleSnare(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    time: number
  ): void {
    const generator = runtime.generator;
    this.scheduleNoiseBurst({
      time,
      duration: 0.12 * (generator?.durationScale ?? 1) * accent.durationScale,
      gain: layer.gain * (0.9 + this.random() * 0.2) * (generator?.gainScale ?? 1) * accent.gainScale,
      filterType: 'bandpass',
      filterHz: (runtime.filterHz ?? 1800) * accent.filterScale,
      q: 0.8,
      attack: Math.max(0.001, 0.002 * (generator?.attackScale ?? 1) * accent.attackScale),
      outputNode: this.resolveLayerOutputNode(layer)
    });

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent,
      frequencies: [180],
      time,
      duration: 0.035 * accent.durationScale,
      voice: 'triangle',
      gain: layer.gain * 0.12 * (generator?.gainScale ?? 1) * accent.gainScale,
      filterType: 'highpass',
      filterHz: 1200 * accent.filterScale,
      attack: 0.001 * accent.attackScale,
      outputNode: this.resolveLayerOutputNode(layer)
    });
  }

  private scheduleHat(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    time: number
  ): void {
    const generator = runtime.generator;
    this.scheduleNoiseBurst({
      time,
      duration: 0.04 * (generator?.durationScale ?? 1) * accent.durationScale,
      gain: layer.gain * (0.84 + this.random() * 0.32) * (generator?.gainScale ?? 1) * accent.gainScale,
      filterType: 'highpass',
      filterHz: (runtime.filterHz ?? 5000) * accent.filterScale,
      q: 0.45,
      attack: Math.max(0.001, 0.001 * (generator?.attackScale ?? 1) * accent.attackScale),
      outputNode: this.resolveLayerOutputNode(layer)
    });
  }

  private scheduleWind(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    time: number
  ): void {
    if (!this.preset) return;

    const generator = runtime.generator;
    const duration = Math.max(
      0.26,
      this.getCurrentStepDuration() * runtime.durationSteps * 1.35 * (generator?.durationScale ?? 1) * accent.durationScale
    );
    const fxSends = this.resolveMusicalFxSends(layer, accent, duration, time);
    this.scheduleNoiseBurst({
      time,
      duration,
      gain: layer.gain * (0.86 + this.random() * 0.18) * (generator?.gainScale ?? 1) * accent.gainScale,
      filterType: 'bandpass',
      filterHz: (runtime.filterHz ?? 800) * accent.filterScale,
      q: 0.35,
      attack: Math.max(0.02, 0.08 * (generator?.attackScale ?? 1) * accent.attackScale),
      outputNode: this.resolveLayerOutputNode(layer),
      ...fxSends
    });
  }

  private scheduleSubPiano(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    stepIndex: number,
    time: number
  ): void {
    const midi = this.resolveMidi(layer, runtime, stepIndex);
    const baseFrequency = midiToFrequency(midi);
    const duration = Math.max(
      0.3,
      this.getCurrentStepDuration(stepIndex) * runtime.durationSteps * 1.1 * accent.durationScale
    );
    const gain = layer.gain * (0.92 + this.random() * 0.16) * accent.gainScale;

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent,
      frequencies: [baseFrequency],
      time,
      duration,
      voice: 'triangle',
      gain,
      filterType: 'lowpass',
      filterHz: (runtime.filterHz ?? 280) * accent.filterScale,
      attack: 0.004 * accent.attackScale,
      outputNode: this.resolveLayerOutputNode(layer)
    });
  }

  private scheduleChord(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    stepIndex: number,
    time: number
  ): void {
    if (!this.preset) return;

    const rootMidi = this.resolveChordRootMidi(layer, runtime, stepIndex);
    const frequencies = [0, 2, 4].map((degreeOffset) => (
      midiToFrequency(this.scaleDegreeToMidi(rootMidi, degreeOffset))
    ));
    const duration = this.getCurrentStepDuration(stepIndex) * runtime.durationSteps * accent.durationScale;

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent,
      frequencies,
      time,
      duration,
      voice: 'square',
      gain: layer.gain * (0.92 + this.random() * 0.16) * accent.gainScale,
      filterType: 'lowpass',
      filterHz: (runtime.filterHz ?? 1500) * accent.filterScale,
      attack: 0.01 * accent.attackScale,
      outputNode: this.resolveLayerOutputNode(layer)
    });
  }

  private scheduleGuitar(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    stepIndex: number,
    time: number
  ): void {
    const midi = this.resolveMidi(layer, runtime, stepIndex);
    const duration = Math.max(
      0.08,
      this.getCurrentStepDuration(stepIndex) * Math.max(1.2, runtime.durationSteps * 0.8) * accent.durationScale
    );

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent,
      frequencies: this.resolveMediumHarmonyFrequencies(layer, runtime, midi),
      time,
      duration,
      voice: 'square',
      gain: layer.gain * (0.9 + this.random() * 0.18) * accent.gainScale,
      filterType: 'lowpass',
      filterHz: (runtime.filterHz ?? 1700) * accent.filterScale,
      attack: 0.004 * accent.attackScale,
      outputNode: this.resolveLayerOutputNode(layer)
    });
  }

  private scheduleHangpan(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    stepIndex: number,
    time: number
  ): void {
    const midi = this.resolveMidi(layer, runtime, stepIndex);
    const duration = Math.max(
      0.18,
      this.getCurrentStepDuration(stepIndex) * runtime.durationSteps * 0.95 * accent.durationScale
    );
    const gain = layer.gain * (0.9 + this.random() * 0.18) * accent.gainScale;

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent,
      frequencies: this.resolveMediumHarmonyFrequencies(layer, runtime, midi),
      time,
      duration,
      voice: 'triangle',
      gain,
      filterType: 'bandpass',
      filterHz: (runtime.filterHz ?? 1300) * accent.filterScale,
      attack: 0.01 * accent.attackScale,
      outputNode: this.resolveLayerOutputNode(layer)
    });
  }

  private scheduleArp(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    stepIndex: number,
    time: number
  ): void {
    const midi = this.resolveMidi(layer, runtime, stepIndex);
    const duration = Math.max(
      0.05,
      this.getCurrentStepDuration(stepIndex) * Math.max(0.7, runtime.durationSteps * 0.7) * accent.durationScale
    );

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent,
      frequencies: this.resolveMediumHarmonyFrequencies(layer, runtime, midi),
      time,
      duration,
      voice: 'square',
      gain: layer.gain * (0.88 + this.random() * 0.18) * accent.gainScale,
      filterType: 'highpass',
      filterHz: (runtime.filterHz ?? 1900) * accent.filterScale,
      attack: 0.003 * accent.attackScale,
      outputNode: this.resolveLayerOutputNode(layer)
    });
  }

  private scheduleVocalChord(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    accent: ResolvedAccentStep,
    stepIndex: number,
    time: number
  ): void {
    if (!this.preset) return;

    const rootMidi = this.resolveChordRootMidi(layer, runtime, stepIndex);
    const chordFrequencies = [0, 2, 4].map((degreeOffset) => (
      midiToFrequency(this.scaleDegreeToMidi(rootMidi, degreeOffset))
    ));
    const duration = Math.max(
      0.45,
      this.getCurrentStepDuration(stepIndex) * runtime.durationSteps * 1.2 * accent.durationScale
    );
    const gain = layer.gain * (0.92 + this.random() * 0.14) * accent.gainScale;
    const mainFormant = (runtime.filterHz ?? 900) * accent.filterScale;

    this.scheduleGeneratedCluster({
      layer,
      runtime,
      accent,
      frequencies: chordFrequencies,
      time,
      duration,
      voice: 'triangle',
      gain,
      filterType: 'bandpass',
      filterHz: mainFormant,
      attack: 0.07 * accent.attackScale,
      outputNode: this.resolveLayerOutputNode(layer)
    });
  }

  private scheduleKickSidechain(time: number): void {
    if (!this.tonalBusGain) return;

    const gainParam = this.tonalBusGain.gain;
    gainParam.cancelScheduledValues(time);
    gainParam.setValueAtTime(Math.max(0.0001, gainParam.value), time);
    gainParam.linearRampToValueAtTime(SIDECHAIN_DUCK_GAIN, time + SIDECHAIN_ATTACK_SEC);
    gainParam.exponentialRampToValueAtTime(1, time + SIDECHAIN_RELEASE_SEC);
  }

  private resolveAccentStep(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    stepIndex: number
  ): ResolvedAccentStep {
    const value = runtime.accentPattern?.length
      ? runtime.accentPattern[stepIndex % runtime.accentPattern.length]
      : 1;
    const accentValue = clamp(value, 0.45, 1.35);
    const filterResponse = layer.voice === 'noise' ? 0.44 : layer.family === 'rhythm' ? 0.3 : layer.family === 'harmony' ? 0.22 : 0.18;

    return {
      gainScale: accentValue,
      filterScale: clamp(1 + (accentValue - 1) * filterResponse, 0.74, 1.32),
      durationScale: clamp(0.72 + accentValue * 0.3, 0.72, 1.14),
      attackScale: clamp(1.14 - (accentValue - 0.5) * 0.46, 0.72, 1.16)
    };
  }

  private resolveLayerOutputNode(layer: AmbientLayerPreset): AudioNode {
    if (layer.id === 'kick' || layer.family === 'rhythm') {
      return this.rhythmBusGain ?? this.masterGain!;
    }

    if (layer.family === 'low') {
      return this.tonalBusGain ?? this.masterGain!;
    }

    if (layer.family === 'harmony') {
      return this.harmonyBusGain ?? this.tonalBusGain ?? this.masterGain!;
    }

    if (layer.family === 'melody') {
      return this.melodyBusGain ?? this.tonalBusGain ?? this.masterGain!;
    }

    if (layer.family === 'texture') {
      return this.textureBusGain ?? this.masterGain!;
    }

    return this.masterGain!;
  }

  private resolveMediumHarmonyFrequencies(
    layer: AmbientLayerPreset,
    runtime: ResolvedLayerRuntime,
    midi: number
  ): number[] {
    const frequencies = [midiToFrequency(midi)];
    const settings = MEDIUM_HARMONY_SETTINGS[layer.id];
    if (!this.preset || !settings) return frequencies;

    let harmonyProbability = settings.probability;
    if (layer.id === 'lead' && runtime.generator?.voice === 'triangle') {
      harmonyProbability -= 0.12;
    }

    if (this.random() > harmonyProbability) {
      return frequencies;
    }

    const wantsThird = this.random() > 0.42;
    const primaryMagnitude = wantsThird ? 2 : 4;
    const isHighMedium = midi >= this.preset.rootMidi + 28;
    const primaryOffset = isHighMedium ? -primaryMagnitude : primaryMagnitude;
    frequencies.push(midiToFrequency(this.transposeMidiByScaleDegree(midi, primaryOffset)));

    if (this.random() < settings.triadProbability) {
      const secondaryMagnitude = primaryMagnitude === 2 ? 4 : 2;
      const secondaryOffset = primaryOffset < 0 ? -secondaryMagnitude : secondaryMagnitude;
      frequencies.push(midiToFrequency(this.transposeMidiByScaleDegree(midi, secondaryOffset)));
    }

    return frequencies;
  }

  private resolveOscillatorVoice(voice: AmbientVoice): OscillatorType {
    return voice === 'triangle' ? 'triangle' : 'square';
  }

  private expandFrequencies(baseFrequencies: number[], partials?: number[]): number[] {
    const ratios = partials?.length ? partials : [1];
    const frequencies: number[] = [];

    baseFrequencies.forEach((baseFrequency) => {
      ratios.forEach((ratio) => {
        frequencies.push(baseFrequency * ratio);
      });
    });

    return frequencies;
  }

  private scheduleGeneratedCluster(options: {
    layer: AmbientLayerPreset;
    runtime: ResolvedLayerRuntime;
    accent: ResolvedAccentStep;
    frequencies: number[];
    time: number;
    duration: number;
    voice: AmbientVoice;
    gain: number;
    filterType: BiquadFilterType;
    filterHz: number;
    attack: number;
    outputNode: AudioNode;
  }): void {
    const generator = options.runtime.generator;
    const duration = Math.max(0.04, options.duration * (generator?.durationScale ?? 1));
    const gain = options.gain * (generator?.gainScale ?? 1);
    const attack = Math.max(0.001, options.attack * (generator?.attackScale ?? 1));
    const mainFrequencies = this.expandFrequencies(options.frequencies, generator?.partials);
    const fxSends = this.resolveMusicalFxSends(options.layer, options.accent, duration, options.time);

    if (TAPE_ECHO_ENABLED && fxSends.tapeEchoSend > 0) {
      this.triggerTapeEchoSpotlight(options.time);
    }

    this.scheduleOscillatorCluster({
      frequencies: mainFrequencies,
      time: options.time,
      duration,
      voice: this.resolveOscillatorVoice(generator?.voice ?? options.voice),
      gain,
      filterType: options.filterType,
      filterHz: options.filterHz,
      attack,
      outputNode: options.outputNode,
      delaySend: fxSends.delaySend,
      reverbSend: fxSends.reverbSend,
      tapeEchoSend: fxSends.tapeEchoSend
    });

    if (!generator?.overlayPartials?.length) return;

    this.scheduleOscillatorCluster({
      frequencies: this.expandFrequencies(options.frequencies, generator.overlayPartials),
      time: options.time,
      duration: duration * 0.92,
      voice: this.resolveOscillatorVoice(generator.overlayVoice ?? options.voice),
      gain: gain * (generator.overlayGain ?? 0.12),
      filterType: options.filterType,
      filterHz: Math.max(120, options.filterHz + 220),
      attack: Math.max(0.001, attack * 1.15),
      outputNode: options.outputNode,
      delaySend: fxSends.delaySend * 0.65,
      reverbSend: fxSends.reverbSend * 0.72,
      tapeEchoSend: fxSends.tapeEchoSend * 0.6
    });
  }

  private scheduleOscillatorCluster(options: {
    frequencies: number[];
    time: number;
    duration: number;
    voice: OscillatorType;
    gain: number;
    filterType: BiquadFilterType;
    filterHz: number;
    attack: number;
    outputNode: AudioNode;
    delaySend?: number;
    reverbSend?: number;
    tapeEchoSend?: number;
  }): void {
    if (!this.context || !this.masterGain || options.frequencies.length === 0) return;

    const preGain = this.context.createGain();
    preGain.gain.value = 1 / options.frequencies.length;

    const filter = this.context.createBiquadFilter();
    filter.type = options.filterType;
    filter.frequency.setValueAtTime(options.filterHz, options.time);

    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(0.0001, options.time);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, options.gain), options.time + options.attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, options.time + options.duration);

    preGain.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(options.outputNode);
    this.connectFxSends(gainNode, options.delaySend, options.reverbSend, options.tapeEchoSend);

    options.frequencies.forEach((frequency) => {
      const oscillator = this.context!.createOscillator();
      oscillator.type = options.voice;
      oscillator.frequency.setValueAtTime(frequency, options.time);
      oscillator.connect(preGain);
      oscillator.start(options.time);
      oscillator.stop(options.time + options.duration + 0.03);
    });
  }

  private scheduleNoiseBurst(options: {
    time: number;
    duration: number;
    gain: number;
    filterType: BiquadFilterType;
    filterHz: number;
    q: number;
    attack: number;
    outputNode: AudioNode;
    delaySend?: number;
    reverbSend?: number;
    tapeEchoSend?: number;
  }): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) return;

    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.context.createBiquadFilter();
    filter.type = options.filterType;
    filter.frequency.setValueAtTime(options.filterHz, options.time);
    filter.Q.setValueAtTime(options.q, options.time);

    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(0.0001, options.time);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, options.gain), options.time + options.attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, options.time + options.duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(options.outputNode);
    this.connectFxSends(gainNode, options.delaySend, options.reverbSend, options.tapeEchoSend);

    source.start(options.time);
    source.stop(options.time + options.duration + 0.02);
  }

  private resolveMidi(layer: AmbientLayerPreset, runtime: ResolvedLayerRuntime, stepIndex: number): number {
    if (!this.preset) return 60;

    const octaveOffset = (runtime.octaveOffset ?? 0) * 12;
    const root = this.preset.rootMidi + octaveOffset;

    switch (layer.noteMode) {
      case 'bass':
        return this.scaleDegreeToMidi(root, this.degreeFromPattern(stepIndex, runtime.degreePattern ?? [0, 0, 4, 0, 3, 0, 4, 0], 2));
      case 'subPiano':
        return this.scaleDegreeToMidi(root, this.degreeFromPattern(stepIndex, runtime.degreePattern ?? [0, 0, 3, 0, 4, 0, 2, 0], 4));
      case 'guitar':
        return this.scaleDegreeToMidi(root, this.degreeFromPattern(stepIndex, runtime.degreePattern ?? [0, 2, 4, 2, 1, 3, 4, 2], 2));
      case 'hangpan':
        return this.scaleDegreeToMidi(root, this.degreeFromPattern(stepIndex, runtime.degreePattern ?? [0, 2, 4, 1, 3, 2, 4, 1], 2));
      case 'arp':
        return this.scaleDegreeToMidi(root, this.degreeFromPattern(stepIndex, runtime.degreePattern ?? [0, 2, 4, 2, 1, 3, 4, 2], 1));
      case 'vocal':
        return this.scaleDegreeToMidi(root, this.degreeFromPattern(stepIndex, runtime.degreePattern ?? [0, 2, 4, 3], STEPS_PER_BAR));
      case 'walk':
        return root + this.nextWalkInterval(runtime.degreePattern);
      case 'accent':
        return this.scaleDegreeToMidi(root, pickRandom([0, 2, 4], this.random));
      case 'root':
      default:
        return root;
    }
  }

  private resolveChordRootMidi(_layer: AmbientLayerPreset, runtime: ResolvedLayerRuntime, stepIndex: number): number {
    if (!this.preset) return 60;
    const octaveOffset = (runtime.octaveOffset ?? 0) * 12;
    const root = this.preset.rootMidi + octaveOffset;
    const degree = this.degreeFromPattern(stepIndex, runtime.degreePattern ?? [0, 4, 5, 3], STEPS_PER_BAR);
    return this.scaleDegreeToMidi(root, degree);
  }

  private degreeFromPattern(stepIndex: number, pattern: number[], stepUnit: number): number {
    const index = Math.floor(stepIndex / stepUnit) % pattern.length;
    return pattern[index];
  }

  private resolveAbsoluteScaleDegree(midi: number): number {
    if (!this.preset) return 0;

    const preset = this.preset;
    const diff = midi - preset.rootMidi;
    const baseOctave = Math.floor(diff / 12);
    let closestDegree = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let octave = baseOctave - 2; octave <= baseOctave + 2; octave += 1) {
      preset.scaleIntervals.forEach((interval, index) => {
        const candidate = octave * 12 + interval;
        const distance = Math.abs(candidate - diff);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestDegree = octave * preset.scaleIntervals.length + index;
        }
      });
    }

    return closestDegree;
  }

  private transposeMidiByScaleDegree(midi: number, degreeOffset: number): number {
    if (!this.preset) return midi;
    const absoluteDegree = this.resolveAbsoluteScaleDegree(midi);
    return this.scaleDegreeToMidi(this.preset.rootMidi, absoluteDegree + degreeOffset);
  }

  private scaleDegreeToMidi(rootMidi: number, degree: number): number {
    if (!this.preset) return rootMidi;

    const scaleLength = this.preset.scaleIntervals.length;
    const octaveShift = Math.floor(degree / scaleLength) * 12;
    const normalized = ((degree % scaleLength) + scaleLength) % scaleLength;
    return rootMidi + this.preset.scaleIntervals[normalized] + octaveShift;
  }

  private nextWalkInterval(variantPattern?: number[]): number {
    if (!this.preset) return 0;

    if (variantPattern && variantPattern.length > 0 && this.random() > 0.42) {
      const degree = variantPattern[(this.stepIndex + this.variationCounter) % variantPattern.length] % this.preset.scaleIntervals.length;
      this.melodyDegree = degree;
      return this.preset.scaleIntervals[this.melodyDegree];
    }

    const options = [-2, -1, 1, 2];
    const nextDelta = pickRandom(options, this.random);
    let nextDegree = this.melodyDegree + nextDelta;

    while (nextDegree < 0) {
      nextDegree += this.preset.scaleIntervals.length;
    }

    nextDegree %= this.preset.scaleIntervals.length;

    if (nextDegree === this.melodyDegree) {
      this.melodyRepeatCount += 1;
    } else {
      this.melodyRepeatCount = 0;
    }

    if (this.melodyRepeatCount >= 2) {
      nextDegree = (nextDegree + 1) % this.preset.scaleIntervals.length;
      this.melodyRepeatCount = 0;
    }

    this.melodyDegree = nextDegree;
    return this.preset.scaleIntervals[this.melodyDegree];
  }

  private getCurrentBpm(stepIndex = this.stepIndex): number {
    if (!this.preset) return 80;

    const baseBpm = this.preset.bpm[this.intensity];
    const amplitude = BPM_SWING_MAX * BPM_SWING_SCALE[this.intensity] * (this.currentTheme?.bpmSwingScale ?? 1);
    if (amplitude <= 0.01) {
      return baseBpm;
    }

    const cycleSteps = STEPS_PER_BAR * BPM_SWING_CYCLE_BARS[this.intensity];
    const phase = ((stepIndex % cycleSteps) / cycleSteps) * Math.PI * 2 + this.bpmDriftPhaseOffset;
    return clamp(baseBpm + Math.sin(phase) * amplitude, 42, 220);
  }

  private getCurrentStepDuration(stepIndex = this.stepIndex): number {
    return stepDurationFromBpm(this.getCurrentBpm(stepIndex));
  }

  private syncMusicalFxToTempo(stepIndex = this.stepIndex): void {
    if (!this.context || !this.preset || !this.delayNode) return;

    const stepDuration = this.getCurrentStepDuration(stepIndex);
    const now = this.context.currentTime;
    const delayTime = clamp(stepDuration * 3, 0.1, 0.42);
    this.delayNode.delayTime.cancelScheduledValues(now);
    this.delayNode.delayTime.setValueAtTime(delayTime, now);

    if (!this.tapeEchoDelayNode || !this.tapeEchoFeedbackGain || !this.tapeEchoReturnGain) return;

    if (!TAPE_ECHO_ENABLED) {
      this.tapeEchoFeedbackGain.gain.cancelScheduledValues(now);
      this.tapeEchoFeedbackGain.gain.setValueAtTime(0, now);
      this.tapeEchoReturnGain.gain.cancelScheduledValues(now);
      this.tapeEchoReturnGain.gain.setValueAtTime(0, now);
      return;
    }

    const tapeEchoDelayTime = clamp(stepDuration * TAPE_ECHO_TIME_MULTIPLIER[this.intensity], 0.45, 1.15);
    const tapeEchoFeedback = TAPE_ECHO_BASE_FEEDBACK[this.intensity];
    const tapeEchoReturn = TAPE_ECHO_BASE_RETURN[this.intensity];

    this.tapeEchoDelayNode.delayTime.cancelScheduledValues(now);
    this.tapeEchoDelayNode.delayTime.setValueAtTime(tapeEchoDelayTime, now);
    this.tapeEchoFeedbackGain.gain.cancelScheduledValues(now);
    this.tapeEchoFeedbackGain.gain.setValueAtTime(tapeEchoFeedback, now);
    this.tapeEchoReturnGain.gain.cancelScheduledValues(now);
    this.tapeEchoReturnGain.gain.setValueAtTime(tapeEchoReturn, now);
  }

  private resetFxBusFilters(): void {
    if (!this.context) return;

    const now = this.context.currentTime;
    const resetFilter = (node: BiquadFilterNode | null, hz: number): void => {
      if (!node) return;
      node.frequency.cancelScheduledValues(now);
      node.frequency.setValueAtTime(hz, now);
    };

    resetFilter(this.melodyBusFilter, FX_BASE_FILTERS.melody);
    resetFilter(this.harmonyBusFilter, FX_BASE_FILTERS.harmony);
    resetFilter(this.textureBusFilter, FX_BASE_FILTERS.texture);
  }

  private resetTapeEchoSpotlight(): void {
    if (!this.context) return;

    const now = this.context.currentTime;
    this.tapeEchoSpotlightUntil = 0;
    this.tapeEchoCooldownUntil = 0;

    if (this.musicBedGain) {
      this.musicBedGain.gain.cancelScheduledValues(now);
      this.musicBedGain.gain.setValueAtTime(1, now);
    }

    if (this.tapeEchoFeedbackGain) {
      this.tapeEchoFeedbackGain.gain.cancelScheduledValues(now);
      this.tapeEchoFeedbackGain.gain.setValueAtTime(TAPE_ECHO_ENABLED ? TAPE_ECHO_BASE_FEEDBACK[this.intensity] : 0, now);
    }

    if (this.tapeEchoReturnGain) {
      this.tapeEchoReturnGain.gain.cancelScheduledValues(now);
      this.tapeEchoReturnGain.gain.setValueAtTime(TAPE_ECHO_ENABLED ? TAPE_ECHO_BASE_RETURN[this.intensity] : 0, now);
    }
  }

  private triggerTapeEchoSpotlight(startTime: number): void {
    if (!this.context || !this.musicBedGain || !this.tapeEchoFeedbackGain || !this.tapeEchoReturnGain) return;
    if (!TAPE_ECHO_ENABLED) return;
    if (startTime < this.tapeEchoSpotlightUntil || startTime < this.tapeEchoCooldownUntil) return;

    const spotlightEnd = startTime + TAPE_ECHO_SPOTLIGHT_DURATION_SEC;
    const dryReturnTime = startTime + TAPE_ECHO_SPOTLIGHT_HOLD_SEC;
    const fullReleaseTime = dryReturnTime + TAPE_ECHO_SPOTLIGHT_RELEASE_SEC;
    const musicBedParam = this.musicBedGain.gain;
    const feedbackParam = this.tapeEchoFeedbackGain.gain;
    const returnParam = this.tapeEchoReturnGain.gain;
    const baseFeedback = TAPE_ECHO_BASE_FEEDBACK[this.intensity];
    const spotlightFeedback = TAPE_ECHO_SPOTLIGHT_FEEDBACK[this.intensity];
    const baseReturn = TAPE_ECHO_BASE_RETURN[this.intensity];
    const spotlightReturn = TAPE_ECHO_SPOTLIGHT_RETURN[this.intensity];

    this.tapeEchoSpotlightUntil = spotlightEnd;
    this.tapeEchoCooldownUntil = spotlightEnd + TAPE_ECHO_SPOTLIGHT_COOLDOWN_SEC;

    musicBedParam.cancelScheduledValues(startTime);
    musicBedParam.setValueAtTime(Math.max(TAPE_ECHO_SPOTLIGHT_DUCK_GAIN, musicBedParam.value), startTime);
    musicBedParam.linearRampToValueAtTime(TAPE_ECHO_SPOTLIGHT_DUCK_GAIN, startTime + TAPE_ECHO_SPOTLIGHT_ATTACK_SEC);
    musicBedParam.setValueAtTime(TAPE_ECHO_SPOTLIGHT_DUCK_GAIN, dryReturnTime);
    musicBedParam.linearRampToValueAtTime(1, fullReleaseTime);

    feedbackParam.cancelScheduledValues(startTime);
    feedbackParam.setValueAtTime(Math.max(baseFeedback, feedbackParam.value), startTime);
    feedbackParam.linearRampToValueAtTime(spotlightFeedback, startTime + 0.12);
    feedbackParam.linearRampToValueAtTime(baseFeedback, spotlightEnd);

    returnParam.cancelScheduledValues(startTime);
    returnParam.setValueAtTime(Math.max(baseReturn, returnParam.value), startTime);
    returnParam.linearRampToValueAtTime(spotlightReturn, startTime + 0.18);
    returnParam.setValueAtTime(spotlightReturn, startTime + 7.6);
    returnParam.linearRampToValueAtTime(baseReturn, fullReleaseTime);
  }

  private triggerPhaseMusicalFx(previousPhase: AmbientPhase, nextPhase: AmbientPhase): void {
    if (!this.context || previousPhase === nextPhase) return;
    if (this.random() > 0.76) return;

    const now = this.context.currentTime;
    switch (nextPhase) {
      case 'B':
        this.scheduleFilterSweep(this.melodyBusFilter, FX_BASE_FILTERS.melody, 1.34, now, 0.18, 0.9);
        this.scheduleFilterSweep(this.harmonyBusFilter, FX_BASE_FILTERS.harmony, 1.22, now, 0.22, 0.96);
        break;
      case 'C':
        this.scheduleFilterSweep(this.melodyBusFilter, FX_BASE_FILTERS.melody, 1.42, now, 0.14, 0.82);
        this.scheduleFilterSweep(this.harmonyBusFilter, FX_BASE_FILTERS.harmony, 1.28, now, 0.18, 0.9);
        break;
      case 'break':
        this.scheduleFilterSweep(this.harmonyBusFilter, FX_BASE_FILTERS.harmony, 0.72, now, 0.18, 1.05);
        this.scheduleFilterSweep(this.textureBusFilter, FX_BASE_FILTERS.texture, 0.8, now, 0.12, 0.86);
        break;
      case 'A':
      default:
        this.scheduleFilterSweep(this.melodyBusFilter, FX_BASE_FILTERS.melody, 1.12, now, 0.16, 0.72);
        break;
    }
  }

  private scheduleFilterSweep(
    filter: BiquadFilterNode | null,
    baseHz: number,
    targetMultiplier: number,
    startTime: number,
    attackSec: number,
    releaseSec: number
  ): void {
    if (!filter) return;

    const startHz = clamp(baseHz * 0.92, 180, 7200);
    const targetHz = clamp(baseHz * targetMultiplier, 180, 7200);
    filter.frequency.cancelScheduledValues(startTime);
    filter.frequency.setValueAtTime(startHz, startTime);
    filter.frequency.linearRampToValueAtTime(targetHz, startTime + attackSec);
    filter.frequency.exponentialRampToValueAtTime(baseHz, startTime + attackSec + releaseSec);
  }

  private resolveMusicalFxSends(
    layer: AmbientLayerPreset,
    accent: ResolvedAccentStep,
    duration: number,
    time: number
  ): MusicalFxSend {
    const isAccented = accent.gainScale > 1.02;
    const isLong = duration >= this.getCurrentStepDuration() * 1.6;
    let delaySend = 0;
    let reverbSend = 0;
    let tapeEchoSend = 0;

    if (FX_DELAY_LAYER_IDS.includes(layer.id) && isAccented && this.random() < 0.13) {
      const baseDelay = layer.id.startsWith('vocal')
        ? 0.18
        : layer.id === 'hangpan'
          ? 0.14
          : layer.id === 'guitar'
            ? 0.12
            : 0.16;
      delaySend = baseDelay * (0.92 + this.random() * 0.22);
    }

    if (FX_REVERB_LAYER_IDS.includes(layer.id) && (isLong || this.currentPhase === 'break' || this.currentPhase === 'A')) {
      const baseReverb = layer.id === 'wind'
        ? 0.16
        : layer.id === 'hangpan'
          ? 0.14
          : layer.id.startsWith('vocal')
            ? 0.18
            : 0.12;
      const gate = this.currentPhase === 'break' ? 0.88 : 0.68;
      if (this.random() < gate) {
        reverbSend = baseReverb * (0.9 + this.random() * 0.2);
      }
    }

    if (
      TAPE_ECHO_ENABLED &&
      FX_TAPE_ECHO_LAYER_IDS.includes(layer.id) &&
      isLong &&
      (this.currentPhase === 'A' || this.currentPhase === 'break' || this.currentPhase === 'B') &&
      time >= this.tapeEchoSpotlightUntil &&
      time >= this.tapeEchoCooldownUntil &&
      this.random() < TAPE_ECHO_TRIGGER_CHANCE[this.intensity]
    ) {
      const baseTapeEcho = layer.id.startsWith('vocal')
        ? 0.18
        : layer.id === 'hangpan'
          ? 0.14
          : layer.id === 'guitar'
            ? 0.13
            : layer.id === 'chord'
              ? 0.11
              : 0.15;
      tapeEchoSend = baseTapeEcho * (0.92 + this.random() * 0.18);
    }

    return {
      delaySend,
      reverbSend,
      tapeEchoSend
    };
  }

  private connectFxSends(sourceNode: AudioNode, delaySend = 0, reverbSend = 0, tapeEchoSend = 0): void {
    if (!this.context) return;

    if (delaySend > 0 && this.delayInputGain) {
      const sendGain = this.context.createGain();
      sendGain.gain.value = delaySend;
      sourceNode.connect(sendGain);
      sendGain.connect(this.delayInputGain);
    }

    if (reverbSend > 0 && this.reverbInputGain) {
      const sendGain = this.context.createGain();
      sendGain.gain.value = reverbSend;
      sourceNode.connect(sendGain);
      sendGain.connect(this.reverbInputGain);
    }

    if (tapeEchoSend > 0 && this.tapeEchoInputGain) {
      const sendGain = this.context.createGain();
      sendGain.gain.value = tapeEchoSend;
      sourceNode.connect(sendGain);
      sendGain.connect(this.tapeEchoInputGain);
    }
  }

  private createNoiseBuffer(context: AudioContext): AudioBuffer {
    const durationSec = 0.35;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * durationSec), context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  private createRetroImpulseBuffer(context: AudioContext): AudioBuffer {
    const durationSec = 0.85;
    const length = Math.floor(context.sampleRate * durationSec);
    const buffer = context.createBuffer(2, length, context.sampleRate);

    for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
      const data = buffer.getChannelData(channelIndex);
      for (let index = 0; index < length; index += 1) {
        const decay = Math.pow(1 - index / length, 2.8);
        data[index] = (Math.random() * 2 - 1) * decay * (channelIndex === 0 ? 1 : 0.9);
      }
    }

    return buffer;
  }

  private createTapeEchoSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
    const samples = 1024;
    const curve = new Float32Array(new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT));
    const drive = Math.max(0.5, amount);

    for (let index = 0; index < samples; index += 1) {
      const x = (index / (samples - 1)) * 2 - 1;
      curve[index] = Math.tanh(x * drive);
    }

    return curve;
  }
}

let engine: AmbientEngine | null = null;

const getEngine = (): AmbientEngine => {
  if (!engine) {
    engine = new AmbientEngine();
  }
  return engine;
};

export const startAmbient = async (terrain?: string | null, intensity: AmbientIntensity = 'explore'): Promise<void> => {
  await getEngine().start(terrain, intensity);
};

export const stopAmbient = (fadeOutMs?: number): void => {
  getEngine().stop(fadeOutMs);
};

export const resumeAmbient = async (): Promise<void> => {
  await getEngine().resume();
};

export const getAmbientSettings = (): PersistedAmbientSettings => {
  return getEngine().getSettings();
};

export const setAmbientEnabled = (enabled: boolean): void => {
  getEngine().setEnabled(enabled);
};

export const setAmbientVolume = (volume: number): void => {
  getEngine().setVolume(volume);
};

export const getAmbientDebugState = (): AmbientDebugState => {
  return getEngine().getDebugState();
};
