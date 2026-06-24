'use client';

import { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Loader2 } from 'lucide-react';

interface TourData {
  id: string;
  provider: 'matterport' | 'kuula' | 'threejs';
  modelId: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  embedToken?: string | null;
}

export function VirtualTourViewer({ propertyId }: { propertyId: string }) {
  const [tours, setTours] = useState<TourData[]>([]);
  const [activeTour, setActiveTour] = useState<number>(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/modules/virtual-tours/embed?propertyId=${propertyId}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setTours(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>;
  if (!tours.length) return null;

  const current = tours[activeTour];

  const buildEmbedUrl = (tour: TourData): string => {
    if (tour.provider === 'matterport') {
      return `https://my.matterport.com/show/?m=${tour.modelId}${tour.embedToken ? `&token=${tour.embedToken}` : ''}`;
    }
    if (tour.provider === 'kuula') return tour.embedUrl;
    return tour.embedUrl;
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${fullscreen ? 'fixed inset-0 z-50' : 'h-[400px]'}`}>
      <iframe
        src={buildEmbedUrl(current)}
        className="h-full w-full border-0"
        allow="fullscreen; gyroscope; accelerometer; magnetometer"
        allowFullScreen
        title="Tour Virtual 360°"
      />

      {tours.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {tours.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTour(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${i === activeTour ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setFullscreen(!fullscreen)}
        className="absolute right-3 top-3 rounded-lg bg-black/50 p-2 text-white backdrop-blur transition hover:bg-black/70"
        aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
