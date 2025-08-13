export const theme = {
  colors: {
    // Primary brand colors - Enhanced orange palette
    primary: {
      50: '#fff7ed',    // Very light warm orange
      100: '#ffedd5',   // Light warm orange
      200: '#fed7aa',   // Light orange
      300: '#fdba74',   // Medium light orange
      400: '#fb923c',   // Orange
      500: '#f97316',   // Vibrant orange
      600: '#ea580c',   // Dark orange
      700: '#c2410c',   // Darker orange
      800: '#9a3412',   // Very dark orange
      900: '#7c2d12',   // Darkest orange
    },
    
    // Secondary colors - Enhanced yellow palette
    secondary: {
      50: '#fefce8',    // Very light yellow
      100: '#fef3c7',   // Light yellow
      200: '#fde68a',   // Medium light yellow
      300: '#fcd34d',   // Medium yellow
      400: '#fbbf24',   // Yellow
      500: '#f59e0b',   // Vibrant yellow
      600: '#d97706',   // Dark yellow
      700: '#b45309',   // Darker yellow
      800: '#92400e',   // Very dark yellow
      900: '#78350f',   // Darkest yellow
    },
    
    // Accent colors - Enhanced red palette
    accent: {
      50: '#fef2f2',    // Very light red
      100: '#fee2e2',   // Light red
      200: '#fecaca',   // Medium light red
      300: '#fca5a5',   // Medium red
      400: '#f87171',   // Red
      500: '#ef4444',   // Vibrant red
      600: '#dc2626',   // Dark red
      700: '#b91c1c',   // Darker red
      800: '#991b1b',   // Very dark red
      900: '#7f1d1d',   // Darkest red
    },
    
    // Neutral colors - Warm grays that complement the orange theme
    neutral: {
      50: '#fafaf9',    // Very light warm gray
      100: '#f5f5f4',   // Light warm gray
      200: '#e7e5e4',   // Medium light warm gray
      300: '#d6d3d1',   // Medium warm gray
      400: '#a8a29e',   // Medium gray
      500: '#78716c',   // Medium dark gray
      600: '#57534e',   // Dark gray
      700: '#44403c',   // Darker gray
      800: '#292524',   // Very dark gray
      900: '#1c1917',   // Darkest gray
    },
    
    // Semantic colors - Updated to fit the new theme
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
  
  // Background colors - Enhanced with new color palette
  backgrounds: {
    primary: '#fff7ed',      // Very light warm orange
    secondary: '#ffffff',    // white
    tertiary: '#fefce8',     // Very light yellow
    sidebar: '#f97316',      // Vibrant orange
    sidebarHeader: '#ea580c', // Dark orange
    header: 'rgba(255, 237, 213, 0.9)', // Light warm orange/90
    card: '#ffffff',         // white
    modal: '#ffffff',        // white
    table: '#ffffff',        // white
    input: '#ffffff',        // white
    inputFocus: '#fefce8',   // Very light yellow for focus states
    hover: '#fff7ed',        // Very light warm orange for hover states
  },
  
  // Border colors - Enhanced with new color palette
  borders: {
    primary: '#fed7aa',      // Light orange
    secondary: '#e7e5e4',    // Medium light warm gray
    accent: '#f97316',       // Vibrant orange
    dark: '#ea580c',         // Dark orange
    input: '#fed7aa',        // Light orange
    inputError: '#f87171',   // Red
    inputFocus: '#fbbf24',   // Yellow for focus
    table: '#fed7aa',        // Light orange
    card: '#fed7aa',         // Light orange
    modal: '#fed7aa',        // Light orange
    divider: '#e7e5e4',      // Medium light warm gray
  },
  
  // Text colors - Carefully selected for readability
  text: {
    primary: '#1c1917',      // Darkest gray for excellent readability
    secondary: '#44403c',    // Dark gray for good readability
    tertiary: '#78716c',     // Medium dark gray
    inverse: '#ffffff',      // White for dark backgrounds
    muted: '#a8a29e',        // Medium gray
    placeholder: '#78716c',  // Medium dark gray
    error: '#dc2626',        // Dark red
    success: '#16a34a',      // Success green
    warning: '#d97706',      // Dark yellow
    info: '#2563eb',         // Info blue
    link: '#ea580c',         // Dark orange for links
    linkHover: '#c2410c',    // Darker orange for link hover
  },
  
  // Button variants - Enhanced with new color palette
  buttons: {
    primary: {
      background: '#f97316',     // Vibrant orange
      hover: '#ea580c',          // Dark orange
      focus: '#f97316',          // Vibrant orange
      text: '#ffffff',           // white
    },
    secondary: {
      background: '#fbbf24',     // Yellow
      hover: '#f59e0b',          // Dark yellow
      focus: '#fbbf24',          // Yellow
      text: '#44403c',           // Dark gray for readability
    },
    danger: {
      background: '#ef4444',     // Vibrant red
      hover: '#dc2626',          // Dark red
      focus: '#ef4444',          // Vibrant red
      text: '#ffffff',           // white
    },
    outline: {
      background: 'transparent',
      hover: '#fff7ed',          // Very light warm orange
      focus: '#f97316',          // Vibrant orange
      text: '#f97316',           // Vibrant orange
      border: '#f97316',         // Vibrant orange
    },
    ghost: {
      background: 'transparent',
      hover: '#fefce8',          // Very light yellow
      focus: '#fbbf24',          // Yellow
      text: '#78716c',           // Medium dark gray
    },
  },
  
  // Focus states - Enhanced with new color palette
  focus: {
    ring: {
      primary: '#f97316',        // Vibrant orange
      secondary: '#fbbf24',      // Yellow
      danger: '#ef4444',         // Vibrant red
      offset: '#fff7ed',         // Very light warm orange
    },
  },
  
  // Shadows - Enhanced with warm tones
  shadows: {
    sm: '0 1px 2px 0 rgba(249, 115, 22, 0.05)',
    md: '0 4px 6px -1px rgba(249, 115, 22, 0.1), 0 2px 4px -1px rgba(249, 115, 22, 0.06)',
    lg: '0 10px 15px -3px rgba(249, 115, 22, 0.1), 0 4px 6px -2px rgba(249, 115, 22, 0.05)',
    xl: '0 20px 25px -5px rgba(249, 115, 22, 0.1), 0 10px 10px -5px rgba(249, 115, 22, 0.04)',
  },
  
  // Gradients - Enhanced with new color palette
  gradients: {
    primary: 'linear-gradient(to bottom right, #fff7ed, #fefce8, #fed7aa)',
    secondary: 'linear-gradient(to bottom right, #fefce8, #fde68a, #fbbf24)',
    accent: 'linear-gradient(to bottom right, #fef2f2, #fecaca, #f87171)',
    sidebar: 'linear-gradient(to bottom, #f97316, #ea580c)',
    header: 'linear-gradient(to right, rgba(255, 237, 213, 0.9), rgba(254, 252, 232, 0.9))',
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
