export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#fef7ed',    // sc-warm-cream
      100: '#fed7aa',   // sc-light-orange
      500: '#fb923c',   // sc-orange
      600: '#ea580c',   // sc-dark-orange
      700: '#c2410c',   // sc-darker-orange
    },
    
    // Secondary colors
    secondary: {
      50: '#fef3c7',    // sc-light-yellow
      500: '#fbbf24',   // sc-yellow
      600: '#d97706',   // sc-dark-yellow
    },
    
    // Accent colors
    accent: {
      50: '#fecaca',    // sc-light-red
      500: '#f87171',   // sc-red
      600: '#dc2626',   // sc-dark-red
    },
    
    // Neutral colors
    neutral: {
      50: '#f8fafc',    // sc-warm-gray
      100: '#f1f5f9',   // sc-lighter-gray
      200: '#e2e8f0',   // sc-light-gray
      300: '#cbd5e1',   // sc-medium-light-gray
      400: '#94a3b8',   // sc-medium-gray
      500: '#64748b',   // sc-medium-gray
      600: '#475569',   // sc-medium-dark-gray
      700: '#334155',   // sc-dark-gray
      800: '#1e293b',   // sc-darker-gray
      900: '#0f172a',   // sc-darkest-gray
    },
    
    // Semantic colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
    },
    
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
    
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
    },
  },
  
  // Background colors
  backgrounds: {
    primary: '#fef7ed',      // sc-warm-cream
    secondary: '#ffffff',    // white
    sidebar: '#fb923c',      // sc-orange
    sidebarHeader: '#ea580c', // sc-dark-orange
    header: 'rgba(254, 215, 170, 0.8)', // sc-light-orange/80
    card: '#ffffff',         // white
    modal: '#ffffff',        // white
    table: '#ffffff',        // white
    input: '#ffffff',        // white
  },
  
  // Border colors
  borders: {
    primary: '#fed7aa',      // sc-light-orange
    secondary: '#e2e8f0',    // sc-light-gray
    accent: '#fb923c',       // sc-orange
    dark: '#ea580c',         // sc-dark-orange
    input: '#fed7aa',        // sc-light-orange
    inputError: '#f87171',   // sc-red
    table: '#fed7aa',        // sc-light-orange
    card: '#fed7aa',         // sc-light-orange
    modal: '#fed7aa',        // sc-light-orange
  },
  
  // Text colors
  text: {
    primary: '#334155',      // sc-dark-gray
    secondary: '#64748b',    // sc-medium-gray
    tertiary: '#94a3b8',     // sc-medium-light-gray
    inverse: '#fef7ed',      // sc-warm-cream (for dark backgrounds)
    muted: '#94a3b8',        // sc-medium-light-gray
    placeholder: '#64748b',  // sc-medium-gray
    error: '#dc2626',        // sc-dark-red
    success: '#16a34a',      // sc-success-600
    warning: '#d97706',      // sc-warning-600
    info: '#2563eb',         // sc-info-600
  },
  
  // Button variants
  buttons: {
    primary: {
      background: '#fb923c',     // sc-orange
      hover: '#ea580c',          // sc-dark-orange
      focus: '#fb923c',          // sc-orange
      text: '#ffffff',           // white
    },
    secondary: {
      background: '#64748b',     // sc-medium-gray
      hover: '#334155',          // sc-dark-gray
      focus: '#64748b',          // sc-medium-gray
      text: '#ffffff',           // white
    },
    danger: {
      background: '#f87171',     // sc-red
      hover: '#dc2626',          // sc-dark-red
      focus: '#f87171',          // sc-red
      text: '#ffffff',           // white
    },
    outline: {
      background: 'transparent',
      hover: '#fef7ed',          // sc-warm-cream
      focus: '#fb923c',          // sc-orange
      text: '#fb923c',           // sc-orange
      border: '#fb923c',         // sc-orange
    },
  },
  
  // Focus states
  focus: {
    ring: {
      primary: '#fb923c',        // sc-orange
      secondary: '#64748b',      // sc-medium-gray
      danger: '#f87171',         // sc-red
      offset: '#fef7ed',         // sc-warm-cream
    },
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(to bottom right, #fef7ed, #fef3c7, #fed7aa)',
    sidebar: 'linear-gradient(to bottom, #fb923c, #ea580c)',
  },
  
  // Spacing (using Tailwind's spacing scale)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  // Border radius
  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  
  // Z-index values
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

// Type for the theme
export type Theme = typeof theme;

// Helper function to get color values
export const getColor = (path: string): string => {
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

// Export commonly used color combinations
export const colorSchemes = {
  light: {
    background: theme.backgrounds.primary,
    surface: theme.backgrounds.secondary,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.borders.primary,
  },
  dark: {
    background: theme.backgrounds.sidebar,
    surface: theme.backgrounds.sidebarHeader,
    text: theme.text.inverse,
    textSecondary: theme.text.inverse,
    border: theme.borders.dark,
  },
} as const;
