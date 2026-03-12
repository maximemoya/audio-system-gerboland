import { useMemo, useState, type CSSProperties } from 'react';
import { resolveAmbientContext } from './ambient-context';
import type { TerrainAudioKey } from './ambient-math';
import {
  AMBIENT_PRESETS,
  type AmbientIntensity,
  type AmbientLayerFamily,
  type AmbientLayerPreset,
} from './ambient-presets';
import {
  getAmbientThemesForContext,
  selectAmbientTheme,
  type AmbientTheme,
} from './ambient-themes';
import { useAmbient } from './use-ambient';

const TERRAIN_OPTIONS: TerrainAudioKey[] = [
  'normal',
  'feu',
  'eau',
  'plante',
  'electrique',
  'glace',
  'combat',
  'poison',
  'sol',
  'vol',
  'psy',
  'insecte',
  'roche',
  'spectre',
  'dragon',
  'tenebres',
  'acier',
  'fee',
];

const INTENSITY_OPTIONS: AmbientIntensity[] = ['idle', 'hub', 'explore', 'battle'];
const FAMILY_ORDER: AmbientLayerFamily[] = ['rhythm', 'low', 'harmony', 'melody', 'texture'];
const ROUTE_OPTIONS = [
  '/auth',
  '/dashboard',
  '/battle',
  '/zones',
  '/capture-zones',
  '/certifications',
  '/shop',
  '/arcade',
  '/collection',
  '/profile',
  '/tickets',
  '/manage-team',
  '/learnset',
  '/starter-selection',
  '/unknown',
] as const;

type AmbientDashboardProps = {
  initialTerrain?: TerrainAudioKey;
  initialIntensity?: AmbientIntensity;
  className?: string;
};

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
};

type ControlMode = 'manual' | 'route';

const formatTerrainLabel = (terrain: TerrainAudioKey): string => {
  if (terrain === 'electrique') return 'Electrique';
  if (terrain === 'tenebres') return 'Tenebres';
  return terrain.charAt(0).toUpperCase() + terrain.slice(1);
};

const formatFamilyLabel = (family: AmbientLayerFamily): string => {
  if (family === 'low') return 'Low';
  return family.charAt(0).toUpperCase() + family.slice(1);
};

const formatIntensityLabel = (intensity: AmbientIntensity): string => {
  return intensity.charAt(0).toUpperCase() + intensity.slice(1);
};

const formatRouteLabel = (pathname: string): string => {
  if (pathname === '/unknown') return 'Fallback route';
  return pathname;
};

const applyThemeToLayers = (
  layers: AmbientLayerPreset[],
  theme: AmbientTheme | null,
): AmbientLayerPreset[] => {
  if (!theme) return layers;

  return layers
    .filter((layer) => {
      if (theme.blockedLayers?.includes(layer.id)) {
        return false;
      }

      if (theme.allowedLayers?.length) {
        return theme.allowedLayers.includes(layer.id);
      }

      return true;
    })
    .map((layer) => ({
      ...layer,
      weight: layer.weight * (theme.layerWeightMultipliers?.[layer.id] ?? 1),
    }));
};

const MetricCard = ({ label, value, hint }: MetricCardProps) => {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
      <span style={styles.metricHint}>{hint}</span>
    </div>
  );
};

export const AmbientDashboard = ({
  initialTerrain = 'normal',
  initialIntensity = 'explore',
  className,
}: AmbientDashboardProps) => {
  const ambient = useAmbient();
  const initialSnapshot = useMemo(() => ambient.getDebugState(), [ambient]);
  const [controlMode, setControlMode] = useState<ControlMode>('manual');
  const [terrain, setTerrain] = useState<TerrainAudioKey>(initialTerrain);
  const [intensity, setIntensity] = useState<AmbientIntensity>(initialIntensity);
  const [routePath, setRoutePath] = useState<(typeof ROUTE_OPTIONS)[number]>('/dashboard');
  const [battleTerrain, setBattleTerrain] = useState<TerrainAudioKey>('combat');
  const [enabled, setEnabled] = useState(initialSnapshot.settings.enabled);
  const [volume, setVolume] = useState(initialSnapshot.settings.volume);
  const [status, setStatus] = useState<'idle' | 'running' | 'stopped'>(
    initialSnapshot.isRunning ? 'running' : 'idle',
  );
  const [activeThemeId, setActiveThemeId] = useState<string | null>(initialSnapshot.themeId);
  const [activeTerrain, setActiveTerrain] = useState<TerrainAudioKey | null>(initialSnapshot.terrain);
  const [activeIntensity, setActiveIntensity] = useState<AmbientIntensity | null>(initialSnapshot.intensity);

  const resolvedRouteContext = useMemo(() => {
    return resolveAmbientContext({
      pathname: routePath === '/unknown' ? '/' : routePath,
      battleTerrain: routePath === '/battle' ? [battleTerrain] : null,
    });
  }, [battleTerrain, routePath]);

  const effectiveTerrain = controlMode === 'route' ? resolvedRouteContext.terrain : terrain;
  const effectiveIntensity = controlMode === 'route' ? resolvedRouteContext.intensity : intensity;
  const preset = useMemo(() => AMBIENT_PRESETS[effectiveTerrain], [effectiveTerrain]);

  const candidateThemes = useMemo(() => {
    return getAmbientThemesForContext(effectiveTerrain, effectiveIntensity);
  }, [effectiveIntensity, effectiveTerrain]);

  const previewTheme = useMemo(() => {
    return selectAmbientTheme(effectiveTerrain, effectiveIntensity, () => 0);
  }, [effectiveIntensity, effectiveTerrain]);

  const selectedTheme = useMemo(() => {
    const engineTheme = candidateThemes.find((theme) => theme.id === activeThemeId) ?? null;
    const engineMatchesSelection = activeTerrain === effectiveTerrain && activeIntensity === effectiveIntensity;
    return engineMatchesSelection ? engineTheme ?? previewTheme : previewTheme;
  }, [activeIntensity, activeTerrain, activeThemeId, candidateThemes, effectiveIntensity, effectiveTerrain, previewTheme]);

  const eligibleLayers = useMemo(() => {
    const intensityLayers = preset.layers.filter((layer) => layer.intensities.includes(effectiveIntensity));
    return applyThemeToLayers(intensityLayers, selectedTheme);
  }, [effectiveIntensity, preset.layers, selectedTheme]);

  const familyCounts = useMemo(() => {
    return FAMILY_ORDER.map((family) => ({
      family,
      count: eligibleLayers.filter((layer) => layer.family === family).length,
    }));
  }, [eligibleLayers]);

  const topLayers = useMemo(() => {
    return [...eligibleLayers].sort((left, right) => right.weight - left.weight).slice(0, 6);
  }, [eligibleLayers]);

  const refreshEngineSnapshot = () => {
    const snapshot = ambient.getDebugState();
    setEnabled(snapshot.settings.enabled);
    setVolume(snapshot.settings.volume);
    setActiveThemeId(snapshot.themeId);
    setActiveTerrain(snapshot.terrain);
    setActiveIntensity(snapshot.intensity);
    setStatus(snapshot.isRunning ? 'running' : 'stopped');
  };

  const handleStart = async () => {
    await ambient.start(terrain, intensity);
    refreshEngineSnapshot();
    setStatus('running');
  };

  const handleStartFromRoute = async () => {
    await ambient.start(resolvedRouteContext.terrain, resolvedRouteContext.intensity);
    refreshEngineSnapshot();
    setStatus('running');
  };

  const handleResume = async () => {
    await ambient.resume();
    refreshEngineSnapshot();
    setStatus('running');
  };

  const handleStop = () => {
    ambient.stop(320);
    refreshEngineSnapshot();
    setStatus('stopped');
  };

  const handleEnabledChange = (nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    ambient.setEnabled(nextEnabled);
    refreshEngineSnapshot();
    if (!nextEnabled) {
      setStatus('stopped');
    }
  };

  const handleVolumeChange = (nextVolume: number) => {
    setVolume(nextVolume);
    ambient.setVolume(nextVolume);
    refreshEngineSnapshot();
  };

  const density = selectedTheme?.density ?? preset.density[effectiveIntensity];
  const activeLayerCount = eligibleLayers.length;
  const anchorLayers = selectedTheme?.anchorLayers?.length ? selectedTheme.anchorLayers.join(', ') : 'Preset defaults';
  const preferredRhythms = selectedTheme?.preferredHumanRhythms?.length
    ? selectedTheme.preferredHumanRhythms.join(', ')
    : 'Preset defaults';

  return (
    <div className={className} style={styles.shell}>
      <div style={styles.hero}>
        <div>
          <span style={styles.eyebrow}>Ambient Engine</span>
          <h1 style={styles.title}>Dashboard de pilotage audio</h1>
          <p style={styles.subtitle}>
            Controle manuel, simulation de routes, lecture des themes candidats et verification du
            contexte effectivement injecte dans le moteur.
          </p>
        </div>
        <div style={getStatusPillStyle(status)}>
          <span style={getStatusDotStyle(status)} />
          {status === 'running' ? 'Running' : status === 'stopped' ? 'Stopped' : 'Ready'}
        </div>
      </div>

      <div style={styles.grid}>
        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Transport</h2>
            <span style={styles.sectionMeta}>Live engine controls</span>
          </div>

          <div style={styles.controlsRow}>
            <button style={styles.primaryButton} type="button" onClick={() => void handleStart()}>
              Start manual
            </button>
            <button style={styles.primaryButton} type="button" onClick={() => void handleStartFromRoute()}>
              Start route
            </button>
            <button style={styles.secondaryButton} type="button" onClick={() => void handleResume()}>
              Resume
            </button>
            <button style={styles.ghostButton} type="button" onClick={handleStop}>
              Stop
            </button>
          </div>

          <div style={styles.formGrid}>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>Enabled</span>
              <button
                type="button"
                onClick={() => handleEnabledChange(!enabled)}
                style={enabled ? styles.toggleActive : styles.toggleIdle}
              >
                {enabled ? 'On' : 'Off'}
              </button>
            </label>

            <label style={styles.field}>
              <span style={styles.fieldLabel}>Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) => handleVolumeChange(Number(event.target.value))}
                style={styles.range}
              />
              <span style={styles.fieldValue}>{Math.round(volume * 100)}%</span>
            </label>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Control mode</h2>
            <span style={styles.sectionMeta}>Manual scene or route context</span>
          </div>

          <div style={styles.segmentWrap}>
            {(['manual', 'route'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setControlMode(mode)}
                style={mode === controlMode ? styles.segmentActive : styles.segmentIdle}
              >
                {mode === 'manual' ? 'Manual' : 'Route context'}
              </button>
            ))}
          </div>

          {controlMode === 'manual' ? (
            <div style={styles.modeBlock}>
              <div style={styles.segmentGroup}>
                <span style={styles.segmentLabel}>Intensity</span>
                <div style={styles.segmentWrap}>
                  {INTENSITY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setIntensity(option)}
                      style={option === intensity ? styles.segmentActive : styles.segmentIdle}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.segmentGroup}>
                <span style={styles.segmentLabel}>Terrain</span>
                <div style={styles.terrainGrid}>
                  {TERRAIN_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTerrain(option)}
                      style={option === terrain ? styles.terrainActive : styles.terrainIdle}
                    >
                      {formatTerrainLabel(option)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.modeBlock}>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Simulated route</span>
                <select
                  value={routePath}
                  onChange={(event) => setRoutePath(event.target.value as (typeof ROUTE_OPTIONS)[number])}
                  style={styles.select}
                >
                  {ROUTE_OPTIONS.map((pathname) => (
                    <option key={pathname} value={pathname}>
                      {formatRouteLabel(pathname)}
                    </option>
                  ))}
                </select>
              </label>

              {routePath === '/battle' ? (
                <label style={styles.field}>
                  <span style={styles.fieldLabel}>Battle terrain</span>
                  <select
                    value={battleTerrain}
                    onChange={(event) => setBattleTerrain(event.target.value as TerrainAudioKey)}
                    style={styles.select}
                  >
                    {TERRAIN_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {formatTerrainLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div style={styles.contextSummary}>
                <span style={styles.contextChip}>Route: {formatRouteLabel(routePath)}</span>
                <span style={styles.contextChip}>Terrain: {formatTerrainLabel(resolvedRouteContext.terrain)}</span>
                <span style={styles.contextChip}>
                  Intensity: {formatIntensityLabel(resolvedRouteContext.intensity)}
                </span>
              </div>
            </div>
          )}
        </section>

        <section style={styles.metricsPanel}>
          <MetricCard label="BPM" value={String(preset.bpm[effectiveIntensity])} hint={`Tempo for ${effectiveIntensity}`} />
          <MetricCard
            label="Density"
            value={`${density.min}-${density.max}`}
            hint={selectedTheme ? `Theme ${selectedTheme.id}` : 'Preset default'}
          />
          <MetricCard label="Layers" value={String(activeLayerCount)} hint="Eligible themed voices" />
          <MetricCard
            label="Context"
            value={`${formatTerrainLabel(effectiveTerrain)} / ${formatIntensityLabel(effectiveIntensity)}`}
            hint={controlMode === 'route' ? 'Resolved from route mapping' : 'Manual selection'}
          />
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Engine snapshot</h2>
            <span style={styles.sectionMeta}>Current engine state</span>
          </div>

          <div style={styles.snapshotGrid}>
            <div style={styles.snapshotCard}>
              <span style={styles.snapshotLabel}>Active terrain</span>
              <strong style={styles.snapshotValue}>
                {activeTerrain ? formatTerrainLabel(activeTerrain) : 'Not started'}
              </strong>
            </div>
            <div style={styles.snapshotCard}>
              <span style={styles.snapshotLabel}>Active intensity</span>
              <strong style={styles.snapshotValue}>
                {activeIntensity ? formatIntensityLabel(activeIntensity) : 'Not started'}
              </strong>
            </div>
            <div style={styles.snapshotCard}>
              <span style={styles.snapshotLabel}>Active theme</span>
              <strong style={styles.snapshotValue}>{activeThemeId ?? 'No theme selected yet'}</strong>
            </div>
            <div style={styles.snapshotCard}>
              <span style={styles.snapshotLabel}>Anchor layers</span>
              <strong style={styles.snapshotValue}>{anchorLayers}</strong>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Theme candidates</h2>
            <span style={styles.sectionMeta}>Catalog for the current context</span>
          </div>

          <div style={styles.themeList}>
            {candidateThemes.map((theme) => {
              const isSelected = theme.id === selectedTheme?.id;
              return (
                <div key={theme.id} style={isSelected ? styles.themeCardActive : styles.themeCard}>
                  <div style={styles.themeHeader}>
                    <strong>{theme.id}</strong>
                    <span style={styles.themeBadge}>{Math.round(theme.weight * 100)} weight</span>
                  </div>
                  <div style={styles.themeMeta}>
                    <span>Density {theme.density ? `${theme.density.min}-${theme.density.max}` : 'preset'}</span>
                    <span>Anchors {theme.anchorLayers?.join(', ') ?? 'preset'}</span>
                    <span>Human rhythms {theme.preferredHumanRhythms?.join(', ') ?? 'preset'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Families</h2>
            <span style={styles.sectionMeta}>Distribution after theme filtering</span>
          </div>

          <div style={styles.familyList}>
            {familyCounts.map(({ family, count }) => (
              <div key={family} style={styles.familyRow}>
                <span style={styles.familyName}>{formatFamilyLabel(family)}</span>
                <div style={styles.familyBarTrack}>
                  <div
                    style={{
                      ...styles.familyBarFill,
                      width: `${Math.max(10, (count / Math.max(1, eligibleLayers.length)) * 100)}%`,
                    }}
                  />
                </div>
                <strong style={styles.familyCount}>{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Priority layers</h2>
            <span style={styles.sectionMeta}>Highest weighted themed voices</span>
          </div>

          <div style={styles.layerList}>
            {topLayers.map((layer) => (
              <div key={layer.id} style={styles.layerCard}>
                <div>
                  <strong style={styles.layerTitle}>{layer.id}</strong>
                  <div style={styles.layerMeta}>
                    {layer.family} · {layer.voice} · prob {Math.round(layer.probability * 100)}%
                  </div>
                </div>
                <div style={styles.layerStats}>
                  <span>{layer.steps} steps</span>
                  <span>{layer.pulses} pulses</span>
                  <span>w {layer.weight.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Theme overrides</h2>
            <span style={styles.sectionMeta}>Useful constraints for debug</span>
          </div>

          <div style={styles.overrideGrid}>
            <MetricCard label="Allowed" value={selectedTheme?.allowedLayers?.length ? String(selectedTheme.allowedLayers.length) : 'All'} hint={selectedTheme?.allowedLayers?.join(', ') ?? 'No allow-list'} />
            <MetricCard label="Blocked" value={selectedTheme?.blockedLayers?.length ? String(selectedTheme.blockedLayers.length) : '0'} hint={selectedTheme?.blockedLayers?.join(', ') ?? 'No blocked layers'} />
            <MetricCard label="Anchors" value={selectedTheme?.anchorLayers?.length ? String(selectedTheme.anchorLayers.length) : 'Preset'} hint={anchorLayers} />
            <MetricCard label="Rhythms" value={selectedTheme?.preferredHumanRhythms?.length ? String(selectedTheme.preferredHumanRhythms.length) : 'Preset'} hint={preferredRhythms} />
          </div>
        </section>
      </div>
    </div>
  );
};

const getStatusPillStyle = (status: 'idle' | 'running' | 'stopped'): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 999,
  background: status === 'running' ? 'rgba(83, 214, 137, 0.14)' : 'rgba(255,255,255,0.08)',
  border: `1px solid ${status === 'stopped' ? 'rgba(248, 113, 113, 0.35)' : 'rgba(255,255,255,0.1)'}`,
  color: '#f8fafc',
  whiteSpace: 'nowrap',
});

const getStatusDotStyle = (status: 'idle' | 'running' | 'stopped'): CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: status === 'running' ? '#53d689' : status === 'stopped' ? '#f87171' : '#fbbf24',
});

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: '100%',
    padding: 24,
    color: '#f4efe8',
    background: 'radial-gradient(circle at top left, #425b76 0%, #1f2632 42%, #11161d 100%)',
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  eyebrow: {
    display: 'inline-block',
    marginBottom: 8,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    color: '#cbd5e1',
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2rem, 4vw, 3.4rem)',
    lineHeight: '1',
    fontWeight: 700,
  },
  subtitle: {
    maxWidth: 760,
    margin: '12px 0 0',
    color: '#c8d0da',
    fontSize: 15,
    lineHeight: '1.6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 18,
  },
  panel: {
    padding: 20,
    borderRadius: 24,
    background: 'linear-gradient(180deg, rgba(20,26,34,0.88), rgba(12,17,23,0.96))',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
  },
  metricsPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
  },
  metricCard: {
    padding: 18,
    borderRadius: 22,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  metricLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metricValue: {
    fontSize: 24,
    lineHeight: '1.1',
  },
  metricHint: {
    color: '#94a3b8',
    fontSize: 13,
  },
  sectionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'baseline',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
  },
  sectionMeta: {
    color: '#94a3b8',
    fontSize: 13,
  },
  controlsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  primaryButton: {
    padding: '12px 16px',
    border: 0,
    borderRadius: 14,
    background: '#f97316',
    color: '#fff7ed',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.08)',
    color: '#f8fafc',
    fontWeight: 600,
    cursor: 'pointer',
  },
  ghostButton: {
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid rgba(248,113,113,0.32)',
    background: 'rgba(248,113,113,0.08)',
    color: '#fecaca',
    fontWeight: 600,
    cursor: 'pointer',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  field: {
    display: 'grid',
    gap: 10,
  },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 600,
  },
  fieldValue: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  toggleActive: {
    minHeight: 44,
    padding: '0 14px',
    borderRadius: 14,
    border: '1px solid rgba(83,214,137,0.3)',
    background: 'rgba(83,214,137,0.14)',
    color: '#dcfce7',
    fontWeight: 700,
    cursor: 'pointer',
  },
  toggleIdle: {
    minHeight: 44,
    padding: '0 14px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#cbd5e1',
    fontWeight: 700,
    cursor: 'pointer',
  },
  range: {
    width: '100%',
  },
  modeBlock: {
    display: 'grid',
    gap: 16,
    marginTop: 18,
  },
  segmentGroup: {
    display: 'grid',
    gap: 10,
  },
  segmentLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 600,
  },
  segmentWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentActive: {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(251,146,60,0.4)',
    background: 'rgba(249,115,22,0.18)',
    color: '#ffedd5',
    textTransform: 'capitalize',
    cursor: 'pointer',
  },
  segmentIdle: {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#cbd5e1',
    textTransform: 'capitalize',
    cursor: 'pointer',
  },
  terrainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 10,
  },
  terrainActive: {
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 16,
    border: '1px solid rgba(125,211,252,0.4)',
    background: 'rgba(56,189,248,0.14)',
    color: '#e0f2fe',
    cursor: 'pointer',
  },
  terrainIdle: {
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: '#cbd5e1',
    cursor: 'pointer',
  },
  select: {
    minHeight: 44,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#f8fafc',
    padding: '0 12px',
  },
  contextSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  contextChip: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#dbe5f0',
    fontSize: 13,
  },
  snapshotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  snapshotCard: {
    padding: 16,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'grid',
    gap: 6,
  },
  snapshotLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  snapshotValue: {
    fontSize: 16,
    lineHeight: '1.3',
  },
  themeList: {
    display: 'grid',
    gap: 12,
  },
  themeCard: {
    padding: 16,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
  },
  themeCardActive: {
    padding: 16,
    borderRadius: 18,
    border: '1px solid rgba(249,115,22,0.4)',
    background: 'rgba(249,115,22,0.12)',
  },
  themeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  themeBadge: {
    padding: '4px 8px',
    borderRadius: 999,
    background: 'rgba(15,23,42,0.35)',
    color: '#cbd5e1',
    fontSize: 12,
  },
  themeMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    color: '#cbd5e1',
    fontSize: 13,
  },
  familyList: {
    display: 'grid',
    gap: 12,
  },
  familyRow: {
    display: 'grid',
    gridTemplateColumns: '92px 1fr auto',
    gap: 12,
    alignItems: 'center',
  },
  familyName: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  familyBarTrack: {
    height: 12,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  familyBarFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #38bdf8, #f97316)',
  },
  familyCount: {
    color: '#f8fafc',
    fontSize: 13,
  },
  layerList: {
    display: 'grid',
    gap: 12,
  },
  layerCard: {
    padding: 16,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  layerTitle: {
    display: 'block',
    marginBottom: 6,
  },
  layerMeta: {
    color: '#94a3b8',
    fontSize: 13,
  },
  layerStats: {
    display: 'grid',
    gap: 4,
    justifyItems: 'end',
    color: '#cbd5e1',
    fontSize: 12,
  },
  overrideGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
};
