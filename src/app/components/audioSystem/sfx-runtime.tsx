import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { playSfx, resolveRouteEnterEvent, warmupSfx } from './sound-engine';

export const RouteAndSystemSfx: React.FC = () => {
  const location = useLocation();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    warmupSfx();
  }, []);

  useEffect(() => {
    const currentPathname = location.pathname;
    const previousPathname = previousPathnameRef.current;

    if (previousPathname && previousPathname !== currentPathname) {
      playSfx('nav.route.leave', { cooldownMs: 0 });
    }

    const enterEvent = resolveRouteEnterEvent(currentPathname);
    playSfx(enterEvent, { cooldownMs: 0 });

    if (enterEvent !== 'nav.route.enter') {
      window.setTimeout(() => {
        playSfx('nav.route.enter', { cooldownMs: 0 });
      }, 60);
    }

    previousPathnameRef.current = currentPathname;
  }, [location.pathname]);

  useEffect(() => {
    const handleOnline = () => playSfx('system.network.online');
    const handleOffline = () => playSfx('system.network.offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest<HTMLElement>('a[href], button, [role="button"]');
      if (!interactive) return;

      if (interactive.dataset.sfxButton === 'true') {
        return;
      }

      if (interactive.closest('a[href]')) {
        playSfx('nav.link.click');
        return;
      }

      const isDisabled =
        (interactive instanceof HTMLButtonElement && interactive.disabled)
        || interactive.getAttribute('aria-disabled') === 'true';

      if (isDisabled) {
        playSfx('ui.button.disabled.click');
        return;
      }

      playSfx('ui.button.default.click');
    };

    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  return null;
};
