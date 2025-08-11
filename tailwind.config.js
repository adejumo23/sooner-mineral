/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
      
      backgroundColor: {
        'primary': '#fef7ed',      // sc-warm-cream
        'secondary': '#ffffff',    // white
        'sidebar': '#fb923c',      // sc-orange
        'sidebar-header': '#ea580c', // sc-dark-orange
        'header': 'rgba(254, 215, 170, 0.8)', // sc-light-orange/80
        'card': '#ffffff',         // white
        'modal': '#ffffff',        // white
        'table': '#ffffff',        // white
        'input': '#ffffff',        // white
      },
      
      borderColor: {
        'primary': '#fed7aa',      // sc-light-orange
        'secondary': '#e2e8f0',    // sc-light-gray
        'accent': '#fb923c',       // sc-orange
        'dark': '#ea580c',         // sc-dark-orange
        'input': '#fed7aa',        // sc-light-orange
        'input-error': '#f87171',  // sc-red
        'table': '#fed7aa',        // sc-light-orange
        'card': '#fed7aa',         // sc-light-orange
        'modal': '#fed7aa',        // sc-light-orange
      },
      
      textColor: {
        'primary': '#334155',      // sc-dark-gray
        'secondary': '#64748b',    // sc-medium-gray
        'tertiary': '#94a3b8',     // sc-medium-light-gray
        'inverse': '#fef7ed',      // sc-warm-cream (for dark backgrounds)
        'muted': '#94a3b8',        // sc-medium-light-gray
        'placeholder': '#64748b',  // sc-medium-gray
        'error': '#dc2626',        // sc-dark-red
        'success': '#16a34a',      // sc-success-600
        'warning': '#d97706',      // sc-warning-600
        'info': '#2563eb',         // sc-info-600
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to bottom right, #fef7ed, #fef3c7, #fed7aa)',
        'gradient-sidebar': 'linear-gradient(to bottom, #fb923c, #ea580c)',
      },
      
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    },
  },
  plugins: [],
}
