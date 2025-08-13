# Sooner Capital Theme System

## Overview

This theme system provides a comprehensive color palette and design tokens for the Sooner Capital application, featuring an enhanced orange, red, and yellow color scheme that ensures excellent text readability and visual hierarchy.

## Color Scheme

### Primary Colors (Orange Palette)
- **50**: `#fff7ed` - Very light warm orange (backgrounds, subtle highlights)
- **100**: `#ffedd5` - Light warm orange (hover states, secondary backgrounds)
- **200**: `#fed7aa` - Light orange (borders, dividers)
- **300**: `#fdba74` - Medium light orange (focus rings, accents)
- **400**: `#fb923c` - Orange (medium emphasis)
- **500**: `#f97316` - Vibrant orange (primary actions, main brand color)
- **600**: `#ea580c` - Dark orange (hover states, secondary actions)
- **700**: `#c2410c` - Darker orange (active states, emphasis)
- **800**: `#9a3412` - Very dark orange (deep accents)
- **900**: `#7c2d12` - Darkest orange (text on light backgrounds)

### Secondary Colors (Yellow Palette)
- **50**: `#fefce8` - Very light yellow (tertiary backgrounds, focus states)
- **100**: `#fef3c7` - Light yellow (subtle highlights)
- **200**: `#fde68a` - Medium light yellow (gradients, accents)
- **300**: `#fcd34d` - Medium yellow (focus indicators)
- **400**: `#fbbf24` - Yellow (secondary actions, highlights)
- **500**: `#f59e0b` - Vibrant yellow (emphasis, warnings)
- **600**: `#d97706` - Dark yellow (text on light backgrounds)
- **700**: `#b45309` - Darker yellow (deep emphasis)
- **800**: `#92400e` - Very dark yellow (strong emphasis)
- **900**: `#78350f` - Darkest yellow (text on very light backgrounds)

### Accent Colors (Red Palette)
- **50**: `#fef2f2` - Very light red (error backgrounds, subtle alerts)
- **100**: `#fee2e2` - Light red (error highlights)
- **200**: `#fecaca` - Medium light red (error borders)
- **300**: `#fca5a5` - Medium red (error indicators)
- **400**: `#f87171` - Red (error actions, alerts)
- **500**: `#ef4444` - Vibrant red (danger actions, critical alerts)
- **600**: `#dc2626` - Dark red (error text, strong emphasis)
- **700**: `#b91c1c` - Darker red (deep error emphasis)
- **800**: `#991b1b` - Very dark red (strong error emphasis)
- **900**: `#7f1d1d` - Darkest red (text on light backgrounds)

### Neutral Colors (Warm Grays)
- **50**: `#fafaf9` - Very light warm gray (page backgrounds)
- **100**: `#f5f5f4` - Light warm gray (card backgrounds, subtle borders)
- **200**: `#e7e5e4` - Medium light warm gray (borders, dividers)
- **300**: `#d6d3d1` - Medium warm gray (input borders, secondary borders)
- **400**: `#a8a29e` - Medium gray (placeholder text, muted content)
- **500**: `#78716c` - Medium dark gray (secondary text, labels)
- **600**: `#57534e` - Dark gray (tertiary text, subtle emphasis)
- **700**: `#44403c` - Darker gray (primary text, headings)
- **800**: `#292524` - Very dark gray (strong text, emphasis)
- **900**: `#1c1917` - Darkest gray (text on light backgrounds)

## Text Readability Guidelines

### High Contrast Combinations (Excellent Readability)
- **Primary text**: `text-neutral-900` (#1c1917) on light backgrounds
- **Secondary text**: `text-neutral-700` (#44403c) on light backgrounds
- **Tertiary text**: `text-neutral-600` (#78716c) on light backgrounds
- **Inverse text**: `text-white` (#ffffff) on dark backgrounds

### Medium Contrast Combinations (Good Readability)
- **Orange text**: `text-primary-600` (#ea580c) on light backgrounds
- **Yellow text**: `text-secondary-600` (#d97706) on light backgrounds
- **Red text**: `text-accent-700` (#b91c1c) on light backgrounds

### Low Contrast Combinations (Use Sparingly)
- **Light orange text**: `text-primary-100` (#ffedd5) - only on very dark backgrounds
- **Light yellow text**: `text-secondary-100` (#fef3c7) - only on very dark backgrounds
- **Light red text**: `text-accent-100` (#fee2e2) - only on very dark backgrounds

## Background Color Guidelines

### Primary Backgrounds
- **Page background**: `bg-primary-50` (#fff7ed) - Very light warm orange
- **Card background**: `bg-white` (#ffffff) - Pure white for content areas
- **Sidebar background**: `bg-gradient-to-b from-primary-500 to-primary-600` - Orange gradient

### Secondary Backgrounds
- **Header background**: `bg-gradient-to-r from-primary-100/90 to-secondary-50/90` - Subtle gradient
- **Hover states**: `bg-primary-100` (#ffedd5) - Light warm orange
- **Focus states**: `bg-secondary-50` (#fefce8) - Very light yellow

### Semantic Backgrounds
- **Success**: `bg-green-50` with `text-green-800`
- **Warning**: `bg-yellow-50` with `text-yellow-800`
- **Error**: `bg-accent-50` with `text-accent-600`
- **Info**: `bg-blue-50` with `text-blue-800`

## Component Usage Examples

### Buttons
```tsx
// Primary button (orange)
<Button variant="primary">Primary Action</Button>

// Secondary button (yellow)
<Button variant="secondary">Secondary Action</Button>

// Danger button (red)
<Button variant="danger">Delete</Button>
```

### Input Fields
```tsx
// Normal state
<Input className="border-primary-200 focus:ring-primary-500" />

// Error state
<Input className="border-accent-400 focus:ring-accent-500" />
```

### Cards and Containers
```tsx
// Primary card
<div className="bg-white border border-primary-200 shadow-md">
  <h2 className="text-neutral-700">Card Title</h2>
  <p className="text-neutral-500">Card content</p>
</div>
```

## Migration Guide

### Replacing Old Color Classes

1. **Replace `sc-warm-cream`** with `bg-primary-50` or `bg-primary-50`
2. **Replace `sc-orange`** with `bg-primary-500`
3. **Replace `sc-dark-orange`** with `bg-primary-600`
4. **Replace `sc-light-yellow`** with `bg-secondary-50`
5. **Replace `sc-yellow`** with `bg-secondary-400`
6. **Replace `sc-red`** with `bg-accent-400`
7. **Replace `sc-dark-gray`** with `text-neutral-700`
8. **Replace `sc-medium-gray`** with `text-neutral-500`

### Example Migration
```tsx
// Before
<div className="bg-sc-warm-cream text-sc-dark-gray">
  <h1 className="text-sc-orange">Title</h1>
</div>

// After
<div className="bg-primary-50 text-neutral-700">
  <h1 className="text-primary-500">Title</h1>
</div>
```

## Accessibility Features

- **High contrast ratios** for all text combinations
- **Focus indicators** using orange and yellow colors
- **Semantic color usage** for status and alerts
- **Consistent visual hierarchy** through color and spacing
- **WCAG AA compliance** for color contrast requirements

## Customization

The theme can be customized by modifying the color values in:
- `src/theme/theme.ts` - TypeScript theme object
- `src/theme/theme.css` - CSS custom properties
- `tailwind.config.js` - Tailwind CSS configuration

All colors are designed to work together harmoniously while maintaining excellent readability and accessibility standards.
