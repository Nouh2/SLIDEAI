import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark-carbon';
type Mode = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>('dark-carbon');
  const [mode, setMode] = useState<Mode>(() => {
    // Load mode from localStorage or default to dark
    const savedMode = localStorage.getItem('slideai-mode');
    return (savedMode === 'light' || savedMode === 'dark') ? savedMode : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark-carbon');
    root.setAttribute('data-mode', mode);
    localStorage.setItem('slideai-mode', mode);
  }, [mode]);

  const setThemeFunc = () => {
    // Theme switching disabled for now (only dark-carbon available)
  };

  const toggleMode = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme: setThemeFunc, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
