# Centralized Theme System

This directory contains a centralized theme system for the Sooner Capital land management application. All colors, spacing, shadows, and other design tokens are defined in one place for easy maintenance and consistency.

## 🎨 Theme Structure

### Files

- **`theme.ts`** - Main theme configuration with all design tokens
- **`theme.css`** - CSS custom properties (variables) for use in CSS
- **`ThemeContext.tsx`** - React context for theme access
- **`index.ts`** - Main exports and commonly used values
- **`tailwind.config.js`** - Tailwind CSS configuration using theme values

### Design Tokens

The theme includes:

- **Colors**: Primary, secondary, accent, neutral, and semantic colors
- **Backgrounds**: Different background colors for various UI elements
- **Borders**: Border colors for inputs, cards, tables, etc.
- **Text**: Text colors for different contexts and hierarchies
- **Shadows**: Box shadow values for depth
- **Spacing**: Consistent spacing scale
- **Border Radius**: Corner radius values
- **Transitions**: Animation timing values
- **Z-Index**: Layering values

## 🚀 Usage

### In React Components

```tsx
import { useTheme, colors, commonColors } from '../src/theme';

const MyComponent = () => {
  const { theme, getColor } = useTheme();
  
  return (
    <div 
      style={{ 
        backgroundColor: theme.backgrounds.primary,
        color: theme.text.primary 
      }}
    >
      <h1 style={{ color: colors.primary[500] }}>
        Hello World
      </h1>
    </div>
  );
};
```

### In Tailwind Classes

The theme is automatically available in Tailwind classes:

```tsx
<div className="bg-primary text-primary border-border-primary">
  Content
</div>
```

### In CSS

```css
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

## 🔧 Making Changes

### Adding New Colors

1. **Update `theme.ts`**:
```ts
colors: {
  // ... existing colors
  newColor: {
    50: '#f0f9ff',
    500: '#0ea5e9',
    600: '#0284c7',
  },
}
```

2. **Update `theme.css`**:
```css
:root {
  /* ... existing variables */
  --color-new-color-50: #f0f9ff;
  --color-new-color-500: #0ea5e9;
  --color-new-color-600: #0284c7;
}
```

3. **Update `tailwind.config.js`**:
```js
colors: {
  // ... existing colors
  newColor: {
    50: '#f0f9ff',
    500: '#0ea5e9',
    600: '#0284c7',
  },
}
```

### Changing Existing Colors

1. **Update `theme.ts`** - Change the color value
2. **Update `theme.css`** - Change the CSS variable value
3. **Update `tailwind.config.js`** - Change the Tailwind color value
4. **All components using these colors will automatically update**

### Adding New Design Tokens

1. **Add to `theme.ts`**:
```ts
export const theme = {
  // ... existing tokens
  newTokens: {
    value1: 'value',
    value2: 'value',
  },
} as const;
```

2. **Add to `theme.css`** if needed for CSS:
```css
:root {
  /* ... existing variables */
  --new-token-1: value;
  --new-token-2: value;
}
```

3. **Add to `tailwind.config.js`** if needed for Tailwind:
```js
theme: {
  extend: {
    // ... existing extensions
    newProperty: {
      value1: 'value',
      value2: 'value',
    },
  },
}
```

## 📱 Responsive Design

The theme system supports responsive design through Tailwind's responsive prefixes:

```tsx
<div className="bg-primary-50 md:bg-primary-100 lg:bg-primary-500">
  Responsive background
</div>
```

## 🎯 Best Practices

1. **Always use theme values** instead of hardcoded colors
2. **Use semantic color names** (e.g., `error`, `success`) for consistency
3. **Test color contrast** when making changes for accessibility
4. **Update all three files** when making changes (theme.ts, theme.css, tailwind.config.js)
5. **Use the color scale** (50, 100, 500, 600, etc.) for variations

## 🔍 Color Palette

### Primary (Orange)
- **50**: Warm cream (#fef7ed)
- **100**: Light orange (#fed7aa)
- **500**: Orange (#fb923c)
- **600**: Dark orange (#ea580c)

### Secondary (Yellow)
- **50**: Light yellow (#fef3c7)
- **500**: Yellow (#fbbf24)
- **600**: Dark yellow (#d97706)

### Accent (Red)
- **50**: Light red (#fecaca)
- **500**: Red (#f87171)
- **600**: Dark red (#dc2626)

### Neutral (Gray)
- **50**: Warm gray (#f8fafc)
- **100**: Lighter gray (#f1f5f9)
- **200**: Light gray (#e2e8f0)
- **300**: Medium light gray (#cbd5e1)
- **400**: Medium gray (#94a3b8)
- **500**: Medium gray (#64748b)
- **600**: Medium dark gray (#475569)
- **700**: Dark gray (#334155)
- **800**: Darker gray (#1e293b)
- **900**: Darkest gray (#0f172a)

## 🚨 Migration Notes

When migrating from the old `sc-*` color classes:

1. **Replace `sc-warm-cream`** with `bg-primary` or `bg-primary-50`
2. **Replace `sc-orange`** with `bg-primary-500`
3. **Replace `sc-dark-orange`** with `bg-primary-600`
4. **Replace `sc-light-orange`** with `bg-primary-100`
5. **Replace `sc-dark-gray`** with `text-neutral-700`
6. **Replace `sc-medium-gray`** with `text-neutral-500`

## 📚 Examples

### Button Component
```tsx
const Button = ({ variant = 'primary', children, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold transition-normal';
  
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-neutral-500 hover:bg-neutral-600 text-white focus:ring-neutral-500',
    danger: 'bg-accent-500 hover:bg-accent-600 text-white focus:ring-accent-500',
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Card Component
```tsx
const Card = ({ children, className }) => {
  return (
    <div className={`bg-white border border-border-card rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};
```

This centralized system makes it easy to maintain consistent styling across the entire application and quickly make global design changes.
