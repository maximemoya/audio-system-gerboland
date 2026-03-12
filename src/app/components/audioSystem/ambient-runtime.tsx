import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { startAmbient, stopAmbient } from './ambient-engine';
import { resolveAmbientContext } from './ambient-context';

export const RouteAmbientRuntime: React.FC = () => {
  const location = useLocation();
  const battleTerrain = useSelector((state: RootState) => (
    state.battle.visualBattle?.terrain ?? state.battle.battle?.terrain ?? null
  ));

  useEffect(() => {
    const { terrain, intensity } = resolveAmbientContext({
      pathname: location.pathname,
      battleTerrain
    });
    void startAmbient(terrain, intensity);
  }, [location.pathname, battleTerrain]);

  useEffect(() => {
    return () => {
      stopAmbient(240);
    };
  }, []);

  return null;
};
