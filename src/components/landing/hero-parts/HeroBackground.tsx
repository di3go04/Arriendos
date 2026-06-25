export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full bg-gold-400/10 blur-[140px]" />
      <div className="absolute bottom-1/4 left-0 w-[450px] h-[450px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-850 to-brand-800" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(240,185,11,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(59,130,246,0.06) 0%, transparent 40%)`,
        }}
      />
    </div>
  )
}
