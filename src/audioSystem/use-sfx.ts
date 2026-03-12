import { useMemo } from 'react';
import {
  getSfxSettings,
  playSfx,
  setSfxMuted,
  setSfxVolume,
  warmupSfx,
  type PlaySfxOptions
} from './sound-engine';
import type { SfxEventId } from './sfx-config';

export const useSfx = () => {
  return useMemo(() => ({
    play: (eventId: SfxEventId, options?: PlaySfxOptions) => playSfx(eventId, options),
    warmup: () => warmupSfx(),
    getSettings: () => getSfxSettings(),
    setMuted: (muted: boolean) => setSfxMuted(muted),
    setVolume: (volume: number) => setSfxVolume(volume)
  }), []);
};
