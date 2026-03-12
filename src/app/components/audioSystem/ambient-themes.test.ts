import { describe, expect, it } from 'vitest';
import { getAmbientThemesForContext, selectAmbientTheme } from './ambient-themes';

describe('ambient themes', () => {
  it('prefers terrain-specific battle themes when they exist', () => {
    const themes = getAmbientThemesForContext('combat', 'battle');

    expect(themes.length).toBeGreaterThan(1);
    expect(themes.every((theme) => theme.id.startsWith('combat-'))).toBe(true);
  });

  it('falls back to generic explore themes for terrains without dedicated catalog', () => {
    const themes = getAmbientThemesForContext('glace', 'explore');

    expect(themes.map((theme) => theme.id)).toEqual(['generic-explore-drift']);
  });

  it('selects the first weighted theme when random starts at zero', () => {
    const theme = selectAmbientTheme('normal', 'hub', () => 0);

    expect(theme?.id).toBe('normal-hub-open-road');
  });
});
