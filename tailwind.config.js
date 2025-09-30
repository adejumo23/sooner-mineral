/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Use class-based dark mode
  theme: {
    extend: {
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
        'primary': '#fff7ed',      // Very light warm orange
        'secondary': '#ffffff',    // white
        'tertiary': '#fefce8',     // Very light yellow
        'sidebar': '#f97316',      // Vibrant orange
        'sidebar-header': '#ea580c', // Dark orange
        'header': 'rgba(255, 237, 213, 0.9)', // Light warm orange/90
        'card': '#ffffff',         // white
        'modal': '#ffffff',        // white
        'table': '#ffffff',        // white
        'input': '#ffffff',        // white
        'input-focus': '#fefce8',  // Very light yellow for focus states
        'hover': '#fff7ed',        // Very light warm orange for hover states
      },
      
      borderColor: {
        'primary': '#fed7aa',      // Light orange
        'secondary': '#e7e5e4',    // Medium light warm gray
        'accent': '#f97316',       // Vibrant orange
        'dark': '#ea580c',         // Dark orange
        'input': '#fed7aa',        // Light orange
        'input-error': '#f87171',  // Red
        'input-focus': '#fbbf24',  // Yellow for focus
        'table': '#fed7aa',        // Light orange
        'card': '#fed7aa',         // Light orange
        'modal': '#fed7aa',        // Light orange
        'divider': '#e7e5e4',      // Medium light warm gray
      },
      
      textColor: {
        'primary': '#1c1917',      // Darkest gray for excellent readability
        'secondary': '#44403c',    // Dark gray for good readability
        'tertiary': '#78716c',     // Medium dark gray
        'inverse': '#ffffff',      // White for dark backgrounds
        'muted': '#a8a29e',        // Medium gray
        'placeholder': '#78716c',  // Medium dark gray
        'error': '#dc2626',        // Dark red
        'success': '#16a34a',      // Success green
        'warning': '#d97706',      // Dark yellow
        'info': '#2563eb',         // Info blue
        'link': '#ea580c',         // Dark orange for links
        'link-hover': '#c2410c',   // Darker orange for link hover
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(249, 115, 22, 0.05)',
        'md': '0 4px 6px -1px rgba(249, 115, 22, 0.1), 0 2px 4px -1px rgba(249, 115, 22, 0.06)',
        'lg': '0 10px 15px -3px rgba(249, 115, 22, 0.1), 0 4px 6px -2px rgba(249, 115, 22, 0.05)',
        'xl': '0 20px 25px -5px rgba(249, 115, 22, 0.1), 0 10px 10px -5px rgba(249, 115, 22, 0.04)',
      },
      
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to bottom right, #fff7ed, #fefce8, #fed7aa)',
        'gradient-secondary': 'linear-gradient(to bottom right, #fefce8, #fde68a, #fbbf24)',
        'gradient-accent': 'linear-gradient(to bottom right, #fef2f2, #fecaca, #f87171)',
        'gradient-sidebar': 'linear-gradient(to bottom, #f97316, #ea580c)',
        'gradient-header': 'linear-gradient(to right, rgba(255, 237, 213, 0.9), rgba(254, 252, 232, 0.9))',
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
      
      // Legacy color mappings for backward compatibility
      colors: {
        // Legacy Sooner Capital colors (mapped to new theme)
        'sc-warm-cream': '#fff7ed',      // primary-50
        'sc-light-orange': '#ffedd5',    // primary-100
        'sc-orange': '#f97316',          // primary-500
        'sc-dark-orange': '#ea580c',     // primary-600
        'sc-darker-orange': '#c2410c',   // primary-700
        'sc-light-yellow': '#fefce8',    // secondary-50
        'sc-yellow': '#fbbf24',          // secondary-400
        'sc-dark-yellow': '#d97706',     // secondary-600
        'sc-light-red': '#fef2f2',       // accent-50
        'sc-red': '#f87171',             // accent-400
        'sc-dark-red': '#dc2626',        // accent-600
        'sc-warm-gray': '#fafaf9',       // neutral-50
        'sc-lighter-gray': '#f5f5f4',    // neutral-100
        'sc-light-gray': '#e7e5e4',      // neutral-200
        'sc-medium-light-gray': '#d6d3d1', // neutral-300
        'sc-medium-gray': '#78716c',     // neutral-500
        'sc-medium-dark-gray': '#57534e', // neutral-600
        'sc-dark-gray': '#44403c',       // neutral-700
        'sc-darker-gray': '#292524',     // neutral-800
        'sc-darkest-gray': '#1c1917',    // neutral-900
      },
    },
  },
  plugins: [],
}
