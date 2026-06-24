'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center bg-background px-4 font-sans antialiased">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-8">
            An unexpected error occurred. Please reload the page to try again.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
