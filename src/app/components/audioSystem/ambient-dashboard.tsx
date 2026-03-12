import React, { useMemo, useState } from 'react';
import { AMBIENT_PRESETS, type AmbientIntensity, type AmbientLayerFamily } from './ambient-presets';
import type { TerrainAudioKey } from './ambient-math';
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
  'fee'
];

const INTENSITY_OPTIONS: AmbientIntensity[] = ['idle', 'hub', 'explore', 'battle'];
const FAMILY_ORDER: AmbientLayerFamily[] = ['rhythm', 'low', 'harmony', 'melody', 'texture'];

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

const formatTerrainLabel = (terrain: TerrainAudioKey): string => {
  if (terrain === 'electrique') return 'Electrique';
  if (terrain === 'tenebres') return 'Tenebres';
  return terrain.charAt(0).toUpperCase() + terrain.slice(1);
};

const formatFamilyLabel = (family: AmbientLayerFamily): string => {
  if (family === 'low') return 'Low';
  return family.charAt(0).toUpperCase() + family.slice(1);
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, hint }) => {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
      <span style={styles.metricHint}>{hint}</span>
    </div>
  );
};

export const AmbientDashboard: React.FC<AmbientDashboardProps> = ({
  initialTerrain = 'normal',
  initialIntensity = 'explore',
  className
}) => {
  const ambient = useAmbient();
  const settings = ambient.getSettings();
  const [terrain, setTerrain] = useState<TerrainAudioKey>(initialTerrain);
  const [intensity, setIntensity] = useState<AmbientIntensity>(initialIntensity);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [volume, setVolume] = useState(settings.volume);
  const [status, setStatus] = useState<'idle' | 'running' | 'stopped'>('idle');

  const preset = useMemo(() => AMBIENT_PRESETS[terrain], [terrain]);

  const familyCounts = useMemo(() => {
    return FAMILY_ORDER.map((family) => ({
      family,
      count: preset.layers.filter((layer) => layer.family === family && layer.intensities.includes(intensity)).length
    }));
  }, [intensity, preset.layers]);

  const topLayers = useMemo(() => {
    return preset.layers
      .filter((layer) => layer.intensities.includes(intensity))
      .sort((left, right) => right.weight - left.weight)
      .slice(0, 6);
  }, [intensity, preset.layers]);

  const handleStart = async (): Promise<void> => {
    await ambient.start(terrain, intensity);
    setStatus('running');
  };

  const handleResume = async (): Promise<void> => {
    await ambient.resume();
    setStatus('running');
  };

  const handleStop = (): void => {
    ambient.stop(320);
    setStatus('stopped');
  };

  const handleEnabledChange = (nextEnabled: boolean): void => {
    setEnabled(nextEnabled);
    ambient.setEnabled(nextEnabled);
    if (!nextEnabled) {
      setStatus('stopped');
    }
  };

  const handleVolumeChange = (nextVolume: number): void => {
    setVolume(nextVolume);
    ambient.setVolume(nextVolume);
  };

  return (
    <div className={className} style={styles.shell}>
      <div style={styles.hero}>
        <div>
          <span style={styles.eyebrow}>Ambient Engine</span>
          <h1 style={styles.title}>Dashboard de pilotage audio</h1>
          <p style={styles.subtitle}>
            Controle terrain, intensite et niveau de sortie, avec lecture directe des presets du moteur.
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
              Start scene
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
            <h2 style={styles.sectionTitle}>Scene</h2>
            <span style={styles.sectionMeta}>Terrain and intensity mapping</span>
          </div>

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
        </section>

        <section style={styles.metricsPanel}>
          <MetricCard
            label="BPM"
            value={String(preset.bpm[intensity])}
            hint={`Tempo for ${intensity}`}
          />
          <MetricCard
            label="Density"
            value={`${preset.density[intensity].min}-${preset.density[intensity].max}`}
            hint="Active layer window"
          />
          <MetricCard
            label="Layers"
            value={String(preset.layers.filter((layer) => layer.intensities.includes(intensity)).length)}
            hint="Eligible voices"
          />
          <MetricCard
            label="Scale"
            value={preset.scaleIntervals.join(' - ')}
            hint={`Root MIDI ${preset.rootMidi}`}
          />
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Families</h2>
            <span style={styles.sectionMeta}>Distribution by layer family</span>
          </div>

          <div style={styles.familyList}>
            {familyCounts.map(({ family, count }) => (
              <div key={family} style={styles.familyRow}>
                <span style={styles.familyName}>{formatFamilyLabel(family)}</span>
                <div style={styles.familyBarTrack}>
                  <div
                    style={{
                      ...styles.familyBarFill,
                      width: `${Math.max(10, (count / Math.max(1, preset.layers.length)) * 100)}%`
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
            <h2 style={styles.sectionTitle}>Priority Layers</h2>
            <span style={styles.sectionMeta}>Highest weighted voices for current preset</span>
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
      </div>
    </div>
  );
};

const getStatusPillStyle = (status: 'idle' | 'running' | 'stopped'): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 999,
  background: status === 'running' ? 'rgba(83, 214, 137, 0.14)' : 'rgba(255,255,255,0.08)',
  border: `1px solid ${status === 'stopped' ? 'rgba(248, 113, 113, 0.35)' : 'rgba(255,255,255,0.1)'}`,
  color: '#f8fafc',
  whiteSpace: 'nowrap'
});

const getStatusDotStyle = (status: 'idle' | 'running' | 'stopped'): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: status === 'running' ? '#53d689' : status === 'stopped' ? '#f87171' : '#fbbf24'
});

const styles = {
  shell: {
    minHeight: '100%',
    padding: 24,
    color: '#f4efe8',
    background: 'radial-gradient(circle at top left, #425b76 0%, #1f2632 42%, #11161d 100%)',
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif'
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 24
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
    textTransform: 'uppercase'
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2rem, 4vw, 3.4rem)',
    lineHeight: 1,
    fontWeight: 700
  },
  subtitle: {
    maxWidth: 680,
    margin: '12px 0 0',
    color: '#c8d0da',
    fontSize: 15,
    lineHeight: 1.6
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 18
  },
  panel: {
    padding: 20,
    borderRadius: 24,
    background: 'linear-gradient(180deg, rgba(20,26,34,0.88), rgba(12,17,23,0.96))',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.22)'
  },
  metricsPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14
  },
  metricCard: {
    padding: 18,
    borderRadius: 22,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  metricLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 1.1
  },
  metricHint: {
    color: '#94a3b8',
    fontSize: 13
  },
  sectionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'baseline',
    marginBottom: 16
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20
  },
  sectionMeta: {
    color: '#94a3b8',
    fontSize: 13
  },
  controlsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18
  },
  primaryButton: {
    padding: '12px 16px',
    border: 0,
    borderRadius: 14,
    background: '#f97316',
    color: '#fff7ed',
    fontWeight: 700,
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.08)',
    color: '#f8fafc',
    fontWeight: 600,
    cursor: 'pointer'
  },
  ghostButton: {
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid rgba(248,113,113,0.32)',
    background: 'rgba(248,113,113,0.08)',
    color: '#fecaca',
    fontWeight: 600,
    cursor: 'pointer'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14
  },
  field: {
    display: 'grid',
    gap: 10
  },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 600
  },
  fieldValue: {
    color: '#e2e8f0',
    fontSize: 13
  },
  toggleActive: {
    minHeight: 44,
    padding: '0 14px',
    borderRadius: 14,
    border: '1px solid rgba(83,214,137,0.3)',
    background: 'rgba(83,214,137,0.14)',
    color: '#dcfce7',
    fontWeight: 700,
    cursor: 'pointer'
  },
  toggleIdle: {
    minHeight: 44,
    padding: '0 14px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#cbd5e1',
    fontWeight: 700,
    cursor: 'pointer'
  },
  range: {
    width: '100%'
  },
  segmentGroup: {
    display: 'grid',
    gap: 10,
    marginBottom: 18
  },
  segmentLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 600
  },
  segmentWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  segmentActive: {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(251,146,60,0.4)',
    background: 'rgba(249,115,22,0.18)',
    color: '#ffedd5',
    textTransform: 'capitalize',
    cursor: 'pointer'
  },
  segmentIdle: {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#cbd5e1',
    textTransform: 'capitalize',
    cursor: 'pointer'
  },
  terrainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 8
  },
  terrainActive: {
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid rgba(125,211,252,0.34)',
    background: 'rgba(56,189,248,0.15)',
    color: '#e0f2fe',
    cursor: 'pointer'
  },
  terrainIdle: {
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: '#cbd5e1',
    cursor: 'pointer'
  },
  familyList: {
    display: 'grid',
    gap: 12
  },
  familyRow: {
    display: 'grid',
    gridTemplateColumns: '88px 1fr 28px',
    gap: 12,
    alignItems: 'center'
  },
  familyName: {
    color: '#e2e8f0',
    fontSize: 14
  },
  familyBarTrack: {
    height: 10,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  familyBarFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #38bdf8, #f97316)'
  },
  familyCount: {
    textAlign: 'right'
  },
  layerList: {
    display: 'grid',
    gap: 10
  },
  layerCard: {
    padding: 14,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center'
  },
  layerTitle: {
    display: 'block',
    marginBottom: 4,
    fontSize: 15
  },
  layerMeta: {
    color: '#94a3b8',
    fontSize: 13,
    textTransform: 'capitalize'
  },
  layerStats: {
    display: 'grid',
    gap: 4,
    color: '#e2e8f0',
    fontSize: 12,
    textAlign: 'right'
  }
} satisfies Record<string, React.CSSProperties>;

export default AmbientDashboard;
