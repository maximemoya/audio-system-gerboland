import { useMemo } from 'react';
import {
  getAmbientSettings,
  resumeAmbient,
  setAmbientEnabled,
  setAmbientVolume,
  startAmbient,
  stopAmbient
} from './ambient-engine';
import type { AmbientIntensity } from './ambient-presets';

export const useAmbient = () => {
  return useMemo(() => ({
    start: (terrain?: string | null, intensity?: AmbientIntensity) => startAmbient(terrain, intensity),
    stop: (fadeOutMs?: number) => stopAmbient(fadeOutMs),
    resume: () => resumeAmbient(),
    getSettings: () => getAmbientSettings(),
    setEnabled: (enabled: boolean) => setAmbientEnabled(enabled),
    setVolume: (volume: number) => setAmbientVolume(volume)
  }), []);
};
