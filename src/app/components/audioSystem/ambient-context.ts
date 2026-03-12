import { normalizeTerrainKey, type TerrainAudioKey } from './ambient-math';
import type { AmbientIntensity } from './ambient-presets';

type AmbientRuntimeContextInput = {
  pathname: string;
  battleTerrain?: Array<string | null | undefined> | null;
};

type AmbientRuntimeContext = {
  terrain: TerrainAudioKey;
  intensity: AmbientIntensity;
};

const resolveBattleTerrain = (
  terrains?: Array<string | null | undefined> | null
): TerrainAudioKey => {
  if (!Array.isArray(terrains)) {
    return 'combat';
  }

  const firstTerrain = terrains.find((terrain) => (
    typeof terrain === 'string' && terrain.trim().length > 0
  ));

  return normalizeTerrainKey(firstTerrain ?? 'combat');
};

export const resolveAmbientContext = ({
  pathname,
  battleTerrain
}: AmbientRuntimeContextInput): AmbientRuntimeContext => {
  if (pathname === '/auth') return { terrain: 'fee', intensity: 'idle' };
  if (pathname === '/dashboard') return { terrain: 'normal', intensity: 'hub' };
  if (pathname.startsWith('/battle')) {
    return { terrain: resolveBattleTerrain(battleTerrain), intensity: 'battle' };
  }
  if (pathname.startsWith('/zones')) return { terrain: 'plante', intensity: 'explore' };
  if (pathname.startsWith('/capture-zones')) return { terrain: 'normal', intensity: 'explore' };
  if (pathname.startsWith('/certifications')) return { terrain: 'acier', intensity: 'hub' };
  if (pathname.startsWith('/shop')) return { terrain: 'fee', intensity: 'hub' };
  if (pathname.startsWith('/arcade')) return { terrain: 'electrique', intensity: 'hub' };

  if (
    pathname.startsWith('/collection')
    || pathname.startsWith('/profile')
    || pathname.startsWith('/tickets')
    || pathname.startsWith('/manage-team')
    || pathname.startsWith('/learnset')
    || pathname.startsWith('/starter-selection')
  ) {
    return { terrain: 'psy', intensity: 'hub' };
  }

  return { terrain: 'normal', intensity: 'idle' };
};
