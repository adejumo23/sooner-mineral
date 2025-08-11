import React, { createContext, useContext, ReactNode } from 'react';
import { theme, Theme } from './theme';

interface ThemeContextType {
  theme: Theme;
  getColor: (path: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const getColor = (path: string): string => {
    const keys = path.split('.');
    let value: any = theme;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        console.warn(`Color path "${path}" not found in theme`);
        return '#000000'; // fallback
      }
    }
    
    return value;
  };

  const contextValue: ThemeContextType = {
    theme,
    getColor,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export the theme directly for use in non-React contexts
export { theme };
