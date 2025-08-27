# 8. Styling Guidelines

Styling is managed via Tailwind CSS with a centralized theme.

## Global Theme & Configuration

CSS custom properties in src/styles/globals.css define the design tokens.

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: 0 95 158; /* #005F9E */
  --color-success: 46 125 50; /* #2E7D32 */
  --color-error: 198 40 40; /* #C62828 */
  --font-sans: 'Inter', sans-serif;
}
```

These variables are consumed by tailwind.config.ts to make utility classes available.
