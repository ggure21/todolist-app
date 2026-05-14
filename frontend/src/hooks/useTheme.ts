import { useCallback, useState } from 'react';

type Theme = 'light' | 'dark';

export function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = getInitialTheme();
    applyTheme(t);
    return t;
  });

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
