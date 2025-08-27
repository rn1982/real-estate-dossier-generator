# 4. Component Standards

To ensure a consistent and high-quality codebase, all components will adhere to the following standards.

## Component Classification

- **UI Primitives (src/components/ui/)**: Highly reusable, stateless, "dumb" building blocks (e.g., Button.tsx, Input.tsx). These should use the cva template for style variants.
- **Layout Components (src/components/layout/)**: Simple components responsible for arranging others on the page (e.g., PageWrapper.tsx).
- **Feature Components (src/components/features/)**: "Smart" components that orchestrate UI and layout components to build business functionality (e.g., DossierForm.tsx). They contain state and logic.

## Component Template (for UI Primitives)

```typescript
// src/components/ui/Button.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Define style variants using cva
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      size: {
        default: "h-10 py-2 px-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

// Define component props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// Create the component with forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    const finalClassName = twMerge(clsx(buttonVariants({ variant, size, className })));
    return (
      <button
        className={finalClassName}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

## Naming Conventions

| Element Type | Convention | Example |
|--------------|------------|---------|
| Folders | kebab-case | src/components/features/dossier-form |
| Component Files | PascalCase.tsx | Button.tsx, DossierForm.tsx |
| Component Variables | PascalCase | const DossierForm = ... |
| Hook Files | camelCase.ts | useDossierForm.ts |
| Service/Util Files | camelCase.ts | dossierService.ts |
| Type Definitions | PascalCase | type DossierFormValues = { ... } |
