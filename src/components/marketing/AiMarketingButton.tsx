'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle, Loader2, Copy } from 'lucide-react';

interface MarketingContent {
  title: string;
  description: string;
  seoDescription: string;
  highlights: string[];
  socialCopy: string;
  metaTags: string[];
  suggestedAmenities: string[];
}

export function AiMarketingButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<MarketingContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/modules/ai-marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      const data = await res.json();
      if (data.ok) setContent(data.data);
      else setError(data.error);
    } catch {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (content) {
    return (
      <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
            <CheckCircle className="h-4 w-4" />
            Contenido generado por IA
          </span>
          <button onClick={() => { setContent(null); }} className="text-xs text-zinc-500 hover:text-zinc-700">Limpiar</button>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-500">Título SEO</label>
            <button onClick={() => copyToClipboard(content.title, 'title')} className="text-zinc-400 hover:text-zinc-600">
              {copied === 'title' ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="rounded-lg bg-white px-3 py-2 text-sm dark:bg-zinc-800">{content.title}</p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-500">Meta Description</label>
            <button onClick={() => copyToClipboard(content.seoDescription, 'seo')} className="text-zinc-400 hover:text-zinc-600">
              {copied === 'seo' ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800">{content.seoDescription}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Highlights</label>
          <ul className="space-y-1">
            {content.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-white px-3 py-1.5 text-sm dark:bg-zinc-800">
                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Copy para redes</label>
          <p className="rounded-lg bg-white px-3 py-2 text-sm italic dark:bg-zinc-800">{content.socialCopy}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-purple-700 hover:to-blue-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? 'Generando...' : 'Generar contenido con IA'}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
