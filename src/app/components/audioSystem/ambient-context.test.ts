import { describe, expect, it } from 'vitest';
import { resolveAmbientContext } from './ambient-context';

describe('resolveAmbientContext', () => {
  it('uses the real battle terrain when it is available', () => {
    const context = resolveAmbientContext({
      pathname: '/battle',
      battleTerrain: ['feu', 'combat']
    });

    expect(context).toEqual({ terrain: 'feu', intensity: 'battle' });
  });

  it('falls back to combat for battle routes without terrain data', () => {
    const context = resolveAmbientContext({
      pathname: '/battle',
      battleTerrain: null
    });

    expect(context).toEqual({ terrain: 'combat', intensity: 'battle' });
  });

  it('keeps hub routes on their mapped ambient profile', () => {
    const context = resolveAmbientContext({
      pathname: '/shop'
    });

    expect(context).toEqual({ terrain: 'fee', intensity: 'hub' });
  });
});
