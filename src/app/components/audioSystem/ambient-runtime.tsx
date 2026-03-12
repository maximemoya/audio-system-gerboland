import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startAmbient, stopAmbient } from './ambient-engine';
import type { AmbientIntensity } from './ambient-presets';

const resolveAmbientContext = (pathname: string): { terrain: string; intensity: AmbientIntensity } => {
  if (pathname === '/auth') return { terrain: 'fee', intensity: 'idle' };
  if (pathname === '/dashboard') return { terrain: 'normal', intensity: 'hub' };
  if (pathname.startsWith('/battle')) return { terrain: 'combat', intensity: 'battle' };
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

export const RouteAmbientRuntime: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const { terrain, intensity } = resolveAmbientContext(location.pathname);
    void startAmbient(terrain, intensity);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      stopAmbient(240);
    };
  }, []);

  return null;
};
