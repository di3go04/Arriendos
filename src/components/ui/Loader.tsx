'use client';

import { useReducedMotion } from 'framer-motion';

interface LoaderProps {
  variant?: 'fullscreen' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: { svg: 40, stroke: 2 },
  md: { svg: 56, stroke: 2.5 },
  lg: { svg: 72, stroke: 3 },
};

function BuildingSpinner({ size = 'md', reduce }: { size?: 'sm' | 'md' | 'lg'; reduce: boolean }) {
  const dims = sizeMap[size];
  const dur = reduce ? '0.01s' : '1.4s';

  return (
    <svg
      width={dims.svg}
      height={dims.svg}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
    >
      <rect x="18" y="28" width="44" height="44" rx="4" stroke="var(--brand)" strokeWidth={dims.stroke} fill="none" />
      <path
        d="M10 30L40 6L70 30"
        stroke="var(--brand)"
        strokeWidth={dims.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {!reduce && (
          <animate
            attributeName="stroke-dasharray"
            values="0 200;90 200;0 200"
            dur={dur}
            repeatCount="indefinite"
          />
        )}
      </path>
      {[
        { x: 26, y: 36, begin: '0s' },
        { x: 40, y: 36, begin: '0.2s' },
        { x: 54, y: 36, begin: '0.4s' },
        { x: 26, y: 50, begin: '0.6s' },
        { x: 40, y: 50, begin: '0.8s' },
        { x: 54, y: 50, begin: '1.0s' },
      ].map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width="8" height="8" rx="1.5" fill="var(--warning)" fillOpacity="0.3">
          {!reduce && (
            <animate
              attributeName="fill-opacity"
              values="0.2;1;0.2"
              dur="1.4s"
              begin={w.begin}
              repeatCount="indefinite"
            />
          )}
        </rect>
      ))}
      <rect x="35" y="58" width="10" height="14" rx="2" fill="var(--brand)" />
      <circle cx="40" cy="65" r="2" fill="var(--warning)">
        {!reduce && (
          <animate
            attributeName="r"
            values="2;2.5;2"
            dur="1.4s"
            begin="0s"
            repeatCount="indefinite"
          />
        )}
      </circle>
    </svg>
  );
}

export function Loader({ variant = 'inline', size = 'md', text, className = '' }: LoaderProps) {
  const reduce = useReducedMotion();

  if (variant === 'fullscreen') {
    return (
      <div
        className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-background/80 backdrop-blur-sm ${className}`}
        role="status"
        aria-label="Cargando"
      >
        <BuildingSpinner size="lg" reduce={!!reduce} />
        {text && (
          <p className="text-ink-secondary text-sm font-medium animate-pulse">{text}</p>
        )}
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center gap-2.5 ${className}`}
      role="status"
      aria-label="Cargando"
    >
      <BuildingSpinner size={size} reduce={!!reduce} />
      {text && <span className="text-ink-secondary text-xs font-medium">{text}</span>}
      <span className="sr-only">Cargando…</span>
    </span>
  );
}
