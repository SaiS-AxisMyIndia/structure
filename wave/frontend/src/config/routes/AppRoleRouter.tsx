import React, { useEffect, useRef } from 'react';
import { Router } from './router';
import { Routes } from './registry';
import { AStorage } from '../storage/AStorage';

// Replaces a plain <Router /> at the app root - the very first screen React
// Navigation mounts is never dispatched through a Route method (see
// registry.ts's own guardedDispatch note), so it never runs AuthWare. A
// fresh, unauthenticated launch would otherwise sit on Home (the first
// screen) with no gate at all; this is the one place that redirects it to
// Login instead.
export function AppRoleRouter() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {return;}
    mounted.current = true;
    AStorage.isLogin().then(loggedIn => {
      if (!loggedIn) {Routes.auth.login.clearAll();}
    });
  }, []);

  return <Router />;
}
