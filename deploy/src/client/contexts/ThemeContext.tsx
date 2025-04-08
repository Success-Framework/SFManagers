import React, { createContext, useState, useEffect, useContext } from 'react';

type ThemeType = 'light' | 'dark' | 'custom';

interface CustomTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

interface ThemeContextType {
  theme: ThemeType;
  customTheme: CustomTheme;
  setTheme: (theme: ThemeType) => void;
  setCustomTheme: (theme: CustomTheme) => void;
  applyTheme: () => void;
}

const defaultCustomTheme: CustomTheme = {
  primaryColor: '#007bff',
  secondaryColor: '#6c757d',
  backgroundColor: '#ffffff',
  textColor: '#212529',
  accentColor: '#17a2b8'
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  customTheme: defaultCustomTheme,
  setTheme: () => {},
  setCustomTheme: () => {},
  applyTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const [customTheme, setCustomTheme] = useState<CustomTheme>(defaultCustomTheme);

  // Load theme preferences from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    const savedCustomTheme = localStorage.getItem('customTheme');

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedCustomTheme) {
      try {
        setCustomTheme(JSON.parse(savedCustomTheme));
      } catch (e) {
        console.error('Error parsing custom theme from localStorage', e);
      }
    }
  }, []);

  // Save theme preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('customTheme', JSON.stringify(customTheme));
  }, [customTheme]);

  // Apply the current theme to the document
  const applyTheme = () => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--primary-color', '#007bff');
      root.style.setProperty('--secondary-color', '#6c757d');
      root.style.setProperty('--background-color', '#ffffff');
      root.style.setProperty('--text-color', '#212529');
      root.style.setProperty('--accent-color', '#17a2b8');
      document.body.classList.remove('dark-theme');
      document.body.classList.remove('custom-theme');
      document.body.classList.add('light-theme');
    } else if (theme === 'dark') {
      root.style.setProperty('--primary-color', '#0d6efd');
      root.style.setProperty('--secondary-color', '#6c757d');
      root.style.setProperty('--background-color', '#212529');
      root.style.setProperty('--text-color', '#f8f9fa');
      root.style.setProperty('--accent-color', '#20c997');
      document.body.classList.remove('light-theme');
      document.body.classList.remove('custom-theme');
      document.body.classList.add('dark-theme');
    } else if (theme === 'custom') {
      root.style.setProperty('--primary-color', customTheme.primaryColor);
      root.style.setProperty('--secondary-color', customTheme.secondaryColor);
      root.style.setProperty('--background-color', customTheme.backgroundColor);
      root.style.setProperty('--text-color', customTheme.textColor);
      root.style.setProperty('--accent-color', customTheme.accentColor);
      document.body.classList.remove('light-theme');
      document.body.classList.remove('dark-theme');
      document.body.classList.add('custom-theme');
    }
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme();
  }, [theme, customTheme]);

  const value = {
    theme,
    customTheme,
    setTheme,
    setCustomTheme,
    applyTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext; 