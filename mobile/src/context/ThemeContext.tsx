import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

type ThemePalette = {
  mode: ThemeMode;
  background: string;
  surface: string;
  surfaceSoft: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
  glow: string;
};

type ThemeContextType = {
  mode: ThemeMode;
  colors: ThemePalette;
  toggleTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const THEME_KEY = 'theme_mode';

const lightPalette: ThemePalette = {
  mode: 'light',
  background: '#EFF2F7',
  surface: '#FFFFFF',
  surfaceSoft: '#F8FBFF',
  textPrimary: '#1B2952',
  textSecondary: '#5A657A',
  accent: '#2A86FF',
  border: '#CFE7FF',
  glow: '#A9D8FF',
};

const darkPalette: ThemePalette = {
  mode: 'dark',
  background: '#0B101A',
  surface: '#131B28',
  surfaceSoft: '#1A2534',
  textPrimary: '#E8F1FF',
  textSecondary: '#9FADBF',
  accent: '#3B9CFF',
  border: '#253B59',
  glow: '#2BE572',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark') {
          setMode(stored);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };

    loadTheme();
  }, []);

  const setThemeMode = async (nextMode: ThemeMode) => {
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_KEY, nextMode);
  };

  const toggleTheme = async () => {
    const nextMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
    await setThemeMode(nextMode);
  };

  const colors = useMemo(() => (mode === 'light' ? lightPalette : darkPalette), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
