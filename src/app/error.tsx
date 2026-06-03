'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-destructive">!</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Algo salió mal</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Ocurrió un error inesperado. Intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
