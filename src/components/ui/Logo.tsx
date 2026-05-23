interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 animate-fade-in ${className}`}
      role="img"
      aria-label="rentnow"
    >
      <svg
        width={variant === 'full' ? 36 : 32}
        height={variant === 'full' ? 36 : 32}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect x="6" y="16" width="28" height="20" rx="3" fill="#1e3a5f" />
        <path
          d="M2 18L20 2L38 18"
          stroke="#1e3a5f"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="10" y="20" width="5" height="5" rx="1" fill="white" fillOpacity={0.12} />
        <rect x="18" y="20" width="5" height="5" rx="1" fill="white" fillOpacity={0.12} />
        <rect x="26" y="20" width="5" height="5" rx="1" fill="white" fillOpacity={0.12} />
        <rect x="15" y="27" width="10" height="9" rx="2" fill="#f59e0b" />
        <circle cx="20" cy="31" r="2.5" fill="white" />
      </svg>

      {variant === 'full' && (
        <span className="font-display font-bold text-[#1e3a5f] text-xl md:text-2xl tracking-tight leading-none">
          rentnow
          <span className="text-[#f59e0b]">.</span>
        </span>
      )}
    </div>
  );
}
