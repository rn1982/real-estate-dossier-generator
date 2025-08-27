# AI Real Estate Dossier Generator Frontend Architecture Document (Revised)

**Version:** 1.1  
**Date:** August 21, 2025  
**Author:** Winston, Architect

## Introduction

This document defines the complete front-end architecture for the AI Real Estate Dossier Generator, based on the requirements in the UI/UX Specification. The primary architectural drivers are simplicity, performance, and quality.

**Deployment Platform:** The official deployment platform for the MVP is Vercel. This choice prioritizes speed, ease of use, and cost-effectiveness, providing automatic deployments and a shareable URL for testing and validation.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-21 | 1.0 | Initial architecture created through collaborative refinement. | Winston, Architect |
| 2025-08-21 | 1.1 | Incorporated recommendations from PO Validation Report. | Sarah, Product Owner |

## 1. Template and Framework Selection

The application will be a client-side rendered single-page application built with Vite + React for a fast development experience and an optimized production build.

## 2. Frontend Tech Stack

The following table outlines the specific libraries and versions for the front-end architecture.

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Framework | Vite + React | 5.2.x + 18.3.x | Core UI Framework & Build Tool | Prioritizes development speed and an optimized build for a fast user experience. |
| Language | TypeScript | 5.4.x | Static Typing | Ensures code quality and reduces bugs, critical for reliable data submission. |
| UI Primitives | Radix UI | 1.1.x | Headless Component Primitives | Provides an accessible, functional foundation for custom components (WCAG 2.1 AA). |
| Styling | Tailwind CSS | 3.4.x | Utility-First CSS Framework | Enables rapid and precise implementation of the custom, professional design. |
| State Mgmt | React Hooks | (built-in) | Local & Shared State | Simplest and most efficient way to manage state for a single form. |
| Form Handling | React Hook Form | 7.51.x | Form State & Validation | High-performance library for managing form state and client-side validation. |
| File Uploads | react-dropzone | 14.2.x | File Handling Logic | Lightweight, headless library for building the multi-photo upload capability. |
| Animation | Framer Motion | 11.2.x | UI Animations | Simple yet powerful library for creating subtle, feedback-oriented animations. |
| Testing | Vitest + RTL | 1.6.x + 15.0.x | Unit & Component Testing | Modern, fast testing framework that integrates perfectly with Vite. |
| Linting/Format | ESLint & Prettier | 8.57.x + 3.2.x | Code Quality & Consistency | Enforces a consistent code style, crucial for maintainability. |
| Icons | react-feather | 4.29.x | Iconography | A clean, modern icon library as recommended in the UI/UX specification. |

## 3. Project Structure

The project will follow a refined directory structure organized for clarity, scalability, and separation of concerns.

```
/
├── .vscode/
├── e2e/                  # End-to-end tests (e.g., Playwright, Cypress)
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── features/
│   │   │   └── DossierForm.tsx
│   │   ├── layout/       # Reusable layout components (e.g., PageWrapper)
│   │   └── ui/           # Dumb, reusable UI primitives (e.g., styled Button, Input)
│   ├── config/           # Application configuration
│   │   └── env.ts        # Type-safe environment variable handler
│   ├── hooks/
│   ├── lib/              # Utility functions and library configurations (e.g., cva)
│   ├── services/         # Client-side functions for interacting with APIs
│   ├── styles/
│   │   └── globals.css
│   ├── types/            # Shared TypeScript type definitions (e.g., index.d.ts)
│   ├── App.tsx
│   └── main.tsx
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 4. Component Standards

To ensure a consistent and high-quality codebase, all components will adhere to the following standards.

### Component Classification

- **UI Primitives (src/components/ui/)**: Highly reusable, stateless, "dumb" building blocks (e.g., Button.tsx, Input.tsx). These should use the cva template for style variants.
- **Layout Components (src/components/layout/)**: Simple components responsible for arranging others on the page (e.g., PageWrapper.tsx).
- **Feature Components (src/components/features/)**: "Smart" components that orchestrate UI and layout components to build business functionality (e.g., DossierForm.tsx). They contain state and logic.

### Component Template (for UI Primitives)

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

### Naming Conventions

| Element Type | Convention | Example |
|--------------|------------|---------|
| Folders | kebab-case | src/components/features/dossier-form |
| Component Files | PascalCase.tsx | Button.tsx, DossierForm.tsx |
| Component Variables | PascalCase | const DossierForm = ... |
| Hook Files | camelCase.ts | useDossierForm.ts |
| Service/Util Files | camelCase.ts | dossierService.ts |
| Type Definitions | PascalCase | type DossierFormValues = { ... } |

## 5. State Management

State will be managed by separating UI Form State from Server State.

- **UI Form State**: Handled exclusively by react-hook-form for performance and robust validation.
- **Server State (API Calls)**: Handled exclusively by TanStack Query (@tanstack/react-query) to manage loading, error, and success states declaratively.

This logic will be orchestrated within a custom hook, as shown in the template below.

### State Management Template

```typescript
// src/hooks/useDossierForm.ts

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { submitDossier } from '../services/dossierService';
import { dossierFormSchema } from '../types';

type DossierFormValues = z.infer<typeof dossierFormSchema>;

export const useDossierForm = () => {
  const form = useForm<DossierFormValues>({
    resolver: zodResolver(dossierFormSchema),
    defaultValues: {
      agentEmail: '',
      propertyDetails: '',
      photos: undefined,
    },
  });

  const { mutate: performSubmit, status } = useMutation({
    mutationFn: submitDossier,
    onSuccess: () => form.reset(),
    onError: (error) => console.error("Submission failed:", error),
  });

  const handleSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    // Logic to convert validated 'data' object to FormData
    performSubmit(formData);
  });

  return {
    form,
    handleSubmit,
    status, // 'idle' | 'loading' | 'success' | 'error'
  };
};
```

## 6. API Integration

All API communication will be consolidated into service functions. To align with the YAGNI principle for this MVP, we will use a direct, simple fetch pattern within each service.

### API Service Template

```typescript
// src/services/dossierService.ts

import { DossierPostResponse } from '../types';

export const submitDossier = async (formData: FormData): Promise<DossierPostResponse> => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    console.error("VITE_API_URL is not defined.");
    throw new Error("Application is not configured correctly.");
  }

  const response = await fetch(`${apiUrl}/dossier`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
};
```

## 7. Routing

As a single-page application, routing is minimal. The application will have one main route (/). Conditional rendering based on the form's submission status (from TanStack Query) will be used to display either the form or the success confirmation message.

## 8. Styling Guidelines

Styling is managed via Tailwind CSS with a centralized theme.

### Global Theme & Configuration

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

## 9. Testing Requirements

We will use Vitest and React Testing Library.

### Testing Best Practices

- **Test User Behavior, Not Implementation**: Focus on what the user sees and does.
- **Unit & Integration Tests**: UI primitives will have unit tests. Feature components will have integration tests.
- **End-to-End (E2E) Tests**: The core form submission flow will be covered by an E2E test using Playwright.
- **Mock External Dependencies**: API calls will be mocked using MSW (Mock Service Worker).
- **Code Coverage**: Aim for a minimum of 80% code coverage.

## 10. Environment Configuration

We will use a type-safe environment configuration strategy using Zod to validate variables at startup.

### Type-Safe Configuration Module

```typescript
// src/config/env.ts

import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables.');
}

export const env = parsedEnv.data;
```

## 11. Frontend Developer Standards

### Critical Coding Rules

- **Component Architecture**: Adhere to the ui, layout, and features classification.
- **State Management**: Separate UI state (react-hook-form) from server state (TanStack Query).
- **API Integration**: All API calls must be made through functions in the src/services/ directory.
- **Environment Configuration**: Access variables only through the type-safe env object.
- **Styling**: Use only Tailwind CSS utility classes derived from the theme.
- **Accessibility**: Use accessible primitives and ensure all inputs have labels.

### Quick Reference

- **Commands**: npm run dev, npm run build, npm run test
- **Path Alias**: @/ will be configured as an alias for the src/ directory.
- **Key Patterns**: Use cva for component style variants and useMutation for API calls.