'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

interface PropertyRec {
  propertyId: string;
  title: string;
  monthlyRent: number;
  city: string;
  type: string;
  similarity: number;
  thumbnailUrl?: string;
}

export function SimilarProperties({ propertyId }: { propertyId: string }) {
  const [recs, setRecs] = useState<PropertyRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/modules/recommendations/similar?propertyId=${propertyId}&limit=4`)
      .then(r => r.json())
      .then(res => { if (res.ok) setRecs(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Propiedades similares</h3>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!recs.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Home className="h-4 w-4" />
        Propiedades similares
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {recs.map(rec => (
          <Link
            key={rec.propertyId}
            href={`/propiedades/${rec.propertyId}`}
            className="group rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-2 h-20 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {rec.thumbnailUrl ? (
                <img src={rec.thumbnailUrl} alt={rec.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-300">
                  <Home className="h-8 w-8" />
                </div>
              )}
            </div>
            <p className="truncate text-sm font-medium group-hover:text-blue-600">{rec.title}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-zinc-500">{rec.city} · {rec.type}</span>
              <span className="text-xs font-semibold">${rec.monthlyRent.toLocaleString()}</span>
            </div>
            {rec.similarity > 0 && (
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${Math.round(rec.similarity * 100)}%` }}
                />
              </div>
            )}
          </Link>
        ))}
      </div>
      <Link
        href="/propiedades"
        className="flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        Ver todas <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
