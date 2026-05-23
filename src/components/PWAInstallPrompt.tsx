'use client';

import { Download,Share2,Smartphone } from 'lucide-react';
import { useEffect,useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'RentNow',
        text: 'Gestiona tus arriendos con RentNow',
        url: window.location.origin,
      });
    }
  };

  if (isInstalled) return null;
  if (!showPrompt && !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-lg max-w-sm mx-auto md:ml-auto">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Instala RentNow</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accede rápido desde tu pantalla de inicio</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer border-none"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </button>
              {typeof navigator.share !== 'undefined' && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-bold rounded-lg hover:bg-muted transition-all cursor-pointer bg-transparent"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-1"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
