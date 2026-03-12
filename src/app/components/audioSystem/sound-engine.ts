import {
  DEFAULT_SFX_COOLDOWN_MS,
  EVENT_TO_SAMPLE,
  ROUTE_ENTER_OVERRIDES,
  SAMPLE_LIBRARY
} from './sfx-config';
import type { SfxEventId, SampleId, SynthPreset } from './sfx-config';
import type { Card } from '../shared/schemas';

type PersistedSfxSettings = {
  muted: boolean;
  volume: number;
  tone: 'soft' | 'normal';
};

export type PlaySfxOptions = {
  cooldownMs?: number;
  playbackRate?: number;
  volume?: number;
};

export type CreatureCryCard = Pick<Card, 'id' | 'name' | 'type' | 'rarity' | 'evolutionStage' | 'familySize' | 'stats'> & {
  currentStats?: { hp: number; attack: number; defense: number; speed: number };
  maxHP?: number;
  currentHP?: number;
  cardId?: { stats?: unknown; imageUrl?: string; backgroundUrl?: string };
};

export type PlayCreatureCryOptions = {
  volume?: number;
};

const SETTINGS_STORAGE_KEY = 'geobiloand.sfx.settings';
const DEFAULT_SETTINGS: PersistedSfxSettings = {
  muted: false,
  volume: 0.425,
  tone: 'soft'
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const parseSettings = (raw: string | null): PersistedSfxSettings => {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSfxSettings>;
    const muted = parsed.muted === true;
    const volume = typeof parsed.volume === 'number' ? clamp(parsed.volume, 0, 1) : DEFAULT_SETTINGS.volume;
    const tone = parsed.tone === 'normal' ? 'normal' : 'soft';
    return { muted, volume, tone };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const createNoiseBuffer = (ctx: AudioContext, durationSeconds: number): AudioBuffer => {
  const frameCount = Math.max(1, Math.floor(ctx.sampleRate * durationSeconds));
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.8;
  }
  return buffer;
};

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const normalizeCardStats = (card: CreatureCryCard): { hp: number; attack: number; defense: number; speed: number } => {
  const stats = card.stats as
    | { hp_max?: number; attack_max?: number; defense_max?: number; speed_max?: number }
    | { base?: { hp?: number; attack?: number; defense?: number; speed?: number } }
    | undefined;

  if (stats && typeof stats === 'object') {
    if ('base' in stats && stats.base) {
      return {
        hp: Number(stats.base.hp ?? card.currentStats?.hp ?? card.maxHP ?? 60),
        attack: Number(stats.base.attack ?? card.currentStats?.attack ?? 60),
        defense: Number(stats.base.defense ?? card.currentStats?.defense ?? 60),
        speed: Number(stats.base.speed ?? card.currentStats?.speed ?? 60)
      };
    }

    return {
      hp: Number((stats as { hp_max?: number }).hp_max ?? card.currentStats?.hp ?? card.maxHP ?? 60),
      attack: Number((stats as { attack_max?: number }).attack_max ?? card.currentStats?.attack ?? 60),
      defense: Number((stats as { defense_max?: number }).defense_max ?? card.currentStats?.defense ?? 60),
      speed: Number((stats as { speed_max?: number }).speed_max ?? card.currentStats?.speed ?? 60)
    };
  }

  const nestedStats = card.cardId?.stats as
    | { hp_max?: number; attack_max?: number; defense_max?: number; speed_max?: number }
    | { base?: { hp?: number; attack?: number; defense?: number; speed?: number } }
    | undefined;

  if (nestedStats && typeof nestedStats === 'object') {
    if ('base' in nestedStats && nestedStats.base) {
      return {
        hp: Number(nestedStats.base.hp ?? card.currentStats?.hp ?? card.maxHP ?? 60),
        attack: Number(nestedStats.base.attack ?? card.currentStats?.attack ?? 60),
        defense: Number(nestedStats.base.defense ?? card.currentStats?.defense ?? 60),
        speed: Number(nestedStats.base.speed ?? card.currentStats?.speed ?? 60)
      };
    }

    return {
      hp: Number((nestedStats as { hp_max?: number }).hp_max ?? card.currentStats?.hp ?? card.maxHP ?? 60),
      attack: Number((nestedStats as { attack_max?: number }).attack_max ?? card.currentStats?.attack ?? 60),
      defense: Number((nestedStats as { defense_max?: number }).defense_max ?? card.currentStats?.defense ?? 60),
      speed: Number((nestedStats as { speed_max?: number }).speed_max ?? card.currentStats?.speed ?? 60)
    };
  }

  return {
    hp: Number(card.currentStats?.hp ?? card.maxHP ?? 60),
    attack: Number(card.currentStats?.attack ?? 60),
    defense: Number(card.currentStats?.defense ?? 60),
    speed: Number(card.currentStats?.speed ?? 60)
  };
};

const clampStat = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  return clamp(value, 1, 255);
};

const TYPE_PITCH_OFFSETS: Record<string, number> = {
  feu: 120,
  eau: -80,
  plante: -30,
  electrique: 180,
  glace: 60,
  combat: -20,
  poison: -70,
  sol: -110,
  vol: 110,
  psy: 150,
  insecte: 200,
  roche: -140,
  spectre: -120,
  dragon: 90,
  tenebres: -170,
  acier: -40,
  fee: 160,
  normal: 0
};

const normalizeTypeKey = (type: string): string => {
  return type
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

class SoundEngine {
  private readonly enabled: boolean;
  private settings: PersistedSfxSettings;
  private readonly lastPlayedByEvent: Map<SfxEventId, number>;
  private audioCtx: AudioContext | null;
  private outputNode: AudioNode | null;

  constructor() {
    this.enabled = typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined';
    this.settings = this.enabled
      ? parseSettings(window.localStorage.getItem(SETTINGS_STORAGE_KEY))
      : DEFAULT_SETTINGS;
    this.lastPlayedByEvent = new Map<SfxEventId, number>();
    this.audioCtx = null;
    this.outputNode = null;
  }

  preload(): void {
    if (!this.enabled) return;
    this.ensureContext();
  }

  getSettings(): PersistedSfxSettings {
    return { ...this.settings };
  }

  setMuted(muted: boolean): void {
    this.settings = { ...this.settings, muted };
    this.persistSettings();
  }

  setVolume(volume: number): void {
    this.settings = { ...this.settings, volume: clamp(volume, 0, 1) };
    this.persistSettings();
  }

  play(eventId: SfxEventId, options?: PlaySfxOptions): boolean {
    if (!this.enabled || this.settings.muted) {
      return false;
    }

    const sampleId = EVENT_TO_SAMPLE[eventId];
    const preset = sampleId ? (SAMPLE_LIBRARY[sampleId] as SynthPreset) : undefined;
    if (!sampleId || !preset) {
      return false;
    }

    const now = window.performance?.now?.() ?? Date.now();
    const cooldownMs = options?.cooldownMs ?? DEFAULT_SFX_COOLDOWN_MS;
    const lastPlayedAt = this.lastPlayedByEvent.get(eventId) ?? Number.NEGATIVE_INFINITY;
    if (cooldownMs > 0 && now - lastPlayedAt < cooldownMs) {
      return false;
    }
    this.lastPlayedByEvent.set(eventId, now);

    const ctx = this.ensureContext();
    if (!ctx) {
      return false;
    }

    const playbackRate = clamp(options?.playbackRate ?? 1, 0.5, 2);
    const durationSeconds = Math.max(0.015, (preset.durationMs / 1000) / playbackRate);
    const gainAmount = clamp((options?.volume ?? 1) * this.settings.volume * preset.gain, 0, 1);
    const attack = Math.max(0.001, (preset.attackMs ?? 2) / 1000);
    const release = Math.max(0.002, (preset.releaseMs ?? 40) / 1000);
    const startTime = ctx.currentTime;
    const endTime = startTime + durationSeconds;
    const outputNode = this.ensureOutputNode(ctx);
    const toneScale = this.settings.tone === 'soft' ? 0.86 : 1;
    const frequencyJitter = 1 + (Math.random() * 0.04 - 0.02);
    const softGainScale = this.settings.tone === 'soft' ? 0.5 : 1;
    const dynamicGain = gainAmount * softGainScale * (0.96 + Math.random() * 0.08);

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.linearRampToValueAtTime(dynamicGain, startTime + attack);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, dynamicGain * 0.7), endTime - release);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);
    envelope.connect(outputNode);

    const tone = ctx.createOscillator();
    tone.type = preset.waveform;
    tone.frequency.setValueAtTime(preset.frequency * playbackRate * frequencyJitter * toneScale, startTime);
    if (preset.frequencyEnd) {
      tone.frequency.exponentialRampToValueAtTime(
        Math.max(40, preset.frequencyEnd * playbackRate * frequencyJitter * toneScale),
        endTime
      );
    }
    tone.connect(envelope);
    tone.start(startTime);
    tone.stop(endTime + 0.01);

    const noiseMix = preset.noiseMix ?? 0;
    if (noiseMix > 0) {
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(Math.max(0, Math.min(1, noiseMix * dynamicGain)), startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, endTime);
      noiseGain.connect(envelope);

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = createNoiseBuffer(ctx, durationSeconds);
      noiseSource.connect(noiseGain);
      noiseSource.start(startTime);
      noiseSource.stop(endTime + 0.01);
    }

    return true;
  }

  playCreatureCry(card: CreatureCryCard, options?: PlayCreatureCryOptions): boolean {
    if (!this.enabled || this.settings.muted) {
      return false;
    }

    const ctx = this.ensureContext();
    if (!ctx) {
      return false;
    }

    const cardId = String(card.id ?? card.name ?? 'unknown-creature');
    const stats = normalizeCardStats(card);
    const hp = clampStat(stats.hp, 60);
    const attack = clampStat(stats.attack, 60);
    const defense = clampStat(stats.defense, 60);
    const speed = clampStat(stats.speed, 60);
    const typeKey = normalizeTypeKey(String(card.type ?? 'normal'));
    const rarity = normalizeTypeKey(String(card.rarity ?? 'commune'));
    const evolutionStage = clamp(Number(card.evolutionStage ?? 1), 1, 4);
    const familySize = clamp(Number(card.familySize ?? 1), 1, 4);
    const seed = hashString(`${cardId}:${card.name}:${typeKey}:${rarity}`);
    const rand = (shift: number) => ((seed >> shift) & 0xff) / 255;

    const basePitch = 180 + (TYPE_PITCH_OFFSETS[typeKey] ?? 0);
    const pitchCenter = Math.max(
      90,
      basePitch
      + (speed - 80) * 2.2
      - (hp - 80) * 0.55
      + (attack - defense) * 0.45
      - (evolutionStage - 1) * 24
      + (rand(0) - 0.5) * 36
    );

    const cryDuration = clamp(0.14 + hp / 520 + evolutionStage * 0.025 + familySize * 0.01, 0.16, 0.52);
    const cryGain = clamp(((options?.volume ?? 1) * this.settings.volume) * (0.13 + attack / 900), 0.05, 0.3);
    const noiseMix = clamp(((255 - defense) / 255) * 0.13 + (typeKey === 'spectre' ? 0.07 : 0), 0.01, 0.18);
    const vibratoDepth = 3 + speed / 42;
    const vibratoRate = 8 + speed / 38;
    const attackTime = 0.004 + rand(8) * 0.01;
    const releaseTime = cryDuration * (0.42 + rand(16) * 0.15);
    const waveform: OscillatorType =
      typeKey === 'spectre' || typeKey === 'tenebres' ? 'sawtooth'
        : typeKey === 'eau' || typeKey === 'glace' || typeKey === 'psy' ? 'triangle'
          : typeKey === 'fee' || typeKey === 'fée' ? 'sine'
            : 'square';
    const startTime = ctx.currentTime;
    const endTime = startTime + cryDuration;
    const outputNode = this.ensureOutputNode(ctx);

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.linearRampToValueAtTime(cryGain, startTime + attackTime);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, cryGain * 0.72), endTime - releaseTime);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);
    envelope.connect(outputNode);

    const tone = ctx.createOscillator();
    tone.type = waveform;
    tone.frequency.setValueAtTime(Math.max(80, pitchCenter * (1.3 + rand(24) * 0.16)), startTime);
    tone.frequency.exponentialRampToValueAtTime(Math.max(60, pitchCenter * (0.82 + rand(4) * 0.14)), startTime + cryDuration * 0.34);
    tone.frequency.linearRampToValueAtTime(Math.max(50, pitchCenter * (1.02 + rand(12) * 0.08)), endTime);
    tone.connect(envelope);

    const overtone = ctx.createOscillator();
    overtone.type = waveform === 'square' ? 'triangle' : 'square';
    overtone.frequency.setValueAtTime(Math.max(110, pitchCenter * (1.96 + rand(20) * 0.18)), startTime);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.0001, startTime);
    overtoneGain.gain.linearRampToValueAtTime(cryGain * 0.3, startTime + attackTime * 1.2);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + cryDuration * 0.68);
    overtone.connect(overtoneGain);
    overtoneGain.connect(outputNode);

    const vibrato = ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(vibratoRate, startTime);

    const vibratoGain = ctx.createGain();
    vibratoGain.gain.setValueAtTime(vibratoDepth, startTime);
    vibratoGain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(tone.frequency);

    tone.start(startTime);
    overtone.start(startTime);
    vibrato.start(startTime);
    tone.stop(endTime + 0.02);
    overtone.stop(startTime + cryDuration * 0.7 + 0.02);
    vibrato.stop(endTime + 0.02);

    if (noiseMix > 0) {
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(noiseMix * cryGain, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + cryDuration * 0.55);
      noiseGain.connect(outputNode);

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = createNoiseBuffer(ctx, cryDuration);
      noiseSource.playbackRate.value = 0.75 + rand(28) * 0.9;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = typeKey === 'eau' || typeKey === 'glace' ? 'lowpass' : 'bandpass';
      noiseFilter.frequency.setValueAtTime(
        clamp(900 + (attack - defense) * 10 + TYPE_PITCH_OFFSETS[typeKey] * 3, 220, 3800),
        startTime
      );
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseSource.start(startTime);
      noiseSource.stop(endTime + 0.02);
    }

    return true;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.audioCtx) {
      this.audioCtx = new window.AudioContext({ sampleRate: 22050 });
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume().catch(() => {
        // Some browsers require explicit user interaction; we ignore here.
      });
    }
    return this.audioCtx;
  }

  private ensureOutputNode(ctx: AudioContext): AudioNode {
    if (this.outputNode) {
      return this.outputNode;
    }

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 120;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = this.settings.tone === 'soft' ? 2500 : 3200;
    lowpass.Q.value = 0.7;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;

    highpass.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(ctx.destination);

    this.outputNode = highpass;
    return this.outputNode;
  }

  private persistSettings(): void {
    if (!this.enabled) return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
  }
}

let engine: SoundEngine | null = null;

const getEngine = (): SoundEngine => {
  if (!engine) {
    engine = new SoundEngine();
  }
  return engine;
};

export const warmupSfx = (): void => {
  getEngine().preload();
};

export const playSfx = (eventId: SfxEventId, options?: PlaySfxOptions): boolean => {
  return getEngine().play(eventId, options);
};

export const getSfxSettings = (): PersistedSfxSettings => {
  return getEngine().getSettings();
};

export const setSfxMuted = (muted: boolean): void => {
  getEngine().setMuted(muted);
};

export const setSfxVolume = (volume: number): void => {
  getEngine().setVolume(volume);
};

export const resolveRouteEnterEvent = (pathname: string): SfxEventId => {
  const match = ROUTE_ENTER_OVERRIDES.find(([pattern]) => pattern.test(pathname));
  return match?.[1] ?? 'nav.route.enter';
};

export const playCreatureCry = (card: CreatureCryCard, options?: PlayCreatureCryOptions): boolean => {
  return getEngine().playCreatureCry(card, options);
};

export const listRegisteredSamples = (): SampleId[] => {
  return Object.keys(SAMPLE_LIBRARY) as SampleId[];
};
