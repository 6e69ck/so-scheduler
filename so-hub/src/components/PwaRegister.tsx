'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    // 1. Immediately capture beforeinstallprompt at window root
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa_prompt_ready'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 2. Register service worker immediately on boot
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('PWA service worker registration failed:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  return null;
}
