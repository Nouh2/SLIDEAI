import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light';
type Mode = 'light';

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>('light');
  const [mode] = useState<Mode>('light'); // Always light mode

  useEffect(() => {
    const root = document.documentElement;
    // Force light mode always
    root.setAttribute('data-mode', 'light');
    root.removeAttribute('data-theme'); // Remove any dark theme attribute
    localStorage.setItem('slideai-mode', 'light');
  }, []);

  const setThemeFunc = () => {
    // Theme switching disabled - always light
  };

  const toggleMode = () => {
    // Mode toggling disabled - always light
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
