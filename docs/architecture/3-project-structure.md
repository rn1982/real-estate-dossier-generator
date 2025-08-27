# 3. Project Structure

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
