/** Módulo 10 — registro SW + métrica de instalación */
export function registerProductionPWA() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    (window as Window & { deferredPwaPrompt?: Event }).deferredPwaPrompt = e;
    try {
      localStorage.setItem('rentnow_pwa_install_available', '1');
    } catch {
      /* ignore */
    }
  });

  window.addEventListener('appinstalled', () => {
    try {
      localStorage.setItem('rentnow_pwa_installed_at', new Date().toISOString());
    } catch {
      /* ignore */
    }
  });
}
