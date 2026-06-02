'use client';

import { createContext,useCallback,useContext,useEffect,useRef,useState } from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast' | 'sepia';

const STORAGE_KEY = 'RentNow_theme';

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  themes: ['light', 'dark', 'high-contrast', 'sepia'],
});

export function useTheme() {
  return useContext(ThemeContext);
}

const THEME_CYCLE: Theme[] = ['light', 'dark', 'high-contrast', 'sepia'];

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved && THEME_CYCLE.includes(saved)) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'high-contrast', 'sepia');
  if (theme === 'dark') root.classList.add('dark');
  if (theme === 'high-contrast') root.classList.add('high-contrast');
  if (theme === 'sepia') root.classList.add('sepia');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const mediaRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    applyTheme(initial);

    mediaRef.current = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const next = e.matches ? 'dark' : 'light';
        setThemeState(next);
        applyTheme(next);
      }
    };
    mediaRef.current.addEventListener('change', listener);
    return () => mediaRef.current?.removeEventListener('change', listener);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    const idx = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setTheme(next);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, themes: THEME_CYCLE }}>
      {children}
    </ThemeContext.Provider>
  );
}
