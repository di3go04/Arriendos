'use client';

import { useTheme } from '@/app/layout';

export default function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer`}
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      suppressHydrationWarning
    >
      <span className="text-lg leading-none" suppressHydrationWarning>{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
