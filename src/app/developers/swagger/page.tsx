'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Terminal, Loader2, Sparkles } from 'lucide-react';

export default function SwaggerPage() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 1. Inject Stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css';
    link.id = 'swagger-ui-css';
    document.head.appendChild(link);

    // 2. Inject Script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js';
    script.async = true;
    script.onload = () => {
      // 3. Inject Standalone Preset
      const presetScript = document.createElement('script');
      presetScript.src = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js';
      presetScript.async = true;
      presetScript.onload = () => {
        // Initialize Swagger UI Bundle once all loaded
        try {
          interface SwaggerWindow {
            SwaggerUIBundle: {
              (config: Record<string, unknown>): void;
              presets: { apis: unknown };
            };
            SwaggerUIStandalonePreset: unknown;
          }
          const win = window as unknown as SwaggerWindow;
          if (win.SwaggerUIBundle) {
            win.SwaggerUIBundle({
              url: '/openapi.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                win.SwaggerUIBundle.presets.apis,
                win.SwaggerUIStandalonePreset
              ],
              layout: "BaseLayout",
              defaultModelsExpandDepth: -1, // Hide schema models list by default for cleaner UI
            });
            setLoaded(true);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error('Error initializing Swagger UI:', err);
          setError(true);
        }
      };
      presetScript.onerror = () => setError(true);
      document.body.appendChild(presetScript);
    };
    script.onerror = () => setError(true);
    document.body.appendChild(script);

    // Cleanups
    return () => {
      const css = document.getElementById('swagger-ui-css');
      if (css) css.remove();
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans">
      {/* Premium Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/developers"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <div>
              <h1 className="font-extrabold text-sm leading-tight text-white">Consola API Interactiva</h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Autohospedado Swagger UI
              </p>
            </div>
          </div>
        </div>

        <a
          href="/openapi.json"
          download
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 border-none"
        >
          <Download className="w-4 h-4" />
          Descargar openapi.json
        </a>
      </header>

      {/* Main Swagger Wrapper */}
      <main className="flex-1 bg-white relative">
        {!loaded && !error && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3 text-slate-300 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-semibold tracking-wide animate-pulse">Iniciando Consola Interactiva OpenAPI...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300 z-10 px-4 text-center">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full">
              <Terminal className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Error de Inicialización</h2>
            <p className="text-xs text-slate-400 max-w-xs">No se pudo cargar la librería swagger-ui-dist desde el CDN. Verifica tu conexión a internet.</p>
          </div>
        )}

        {/* Swagger target node */}
        <div id="swagger-ui" className="w-full h-full min-h-[85vh] text-slate-800" />
      </main>

      {/* Embedded CSS Custom Styles for Swagger UI to make it fit beautifully */}
      <style jsx global>{`
        /* Overrides to make Swagger UI look amazing inside dark theme app or beautifully contained */
        .swagger-ui {
          font-family: 'Segoe UI', system-ui, sans-serif !important;
          padding: 24px !important;
        }
        .swagger-ui .info {
          margin: 20px 0 30px 0 !important;
        }
        .swagger-ui .info .title {
          font-family: 'Segoe UI', system-ui, sans-serif !important;
          color: #0f172a !important;
          font-weight: 800 !important;
        }
        .swagger-ui .scheme-container {
          background: #f8fafc !important;
          box-shadow: none !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 16px !important;
          padding: 16px !important;
          margin-bottom: 24px !important;
        }
        .swagger-ui .opblock {
          border-radius: 16px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
        }
        .swagger-ui .opblock .opblock-summary {
          padding: 12px 16px !important;
        }
        .swagger-ui .btn {
          border-radius: 8px !important;
          font-weight: bold !important;
        }
        .swagger-ui select {
          border-radius: 8px !important;
        }
        .swagger-ui input[type=text] {
          border-radius: 8px !important;
        }
      `}</style>
    </div>
  );
}
