# Real Estate Dossier Generator

A professional property documentation system built with React, TypeScript, and Vite. This application provides a modern interface for generating comprehensive real estate dossiers with photo uploads, property details, and professional formatting.

## Prerequisites

Before you begin, ensure you have the following tools installed:

- **Node.js**: Version 20.x or higher (LTS)
- **npm**: Version 10.x or higher
- **Git**: For version control

To verify your installations:
```bash
node --version  # Should output v20.x.x or higher
npm --version   # Should output 10.x.x or higher
git --version   # Should output git version x.x.x
```

## Setup Instructions

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd real-estate-dossier-generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```bash
   VITE_API_URL=http://localhost:3000
   VITE_APP_ENV=development
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will open automatically at http://localhost:3000

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with hot module replacement |
| `npm run build` | Build the production-ready application |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the test suite with Vitest |
| `npm run test:ui` | Run tests with interactive UI |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Run ESLint to check code quality |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |

## Project Structure

```
/
├── api/                  # Serverless API functions
│   └── health.js        # Health check endpoint
├── docs/                # Project documentation
│   ├── architecture/    # Architecture documentation
│   ├── prd/            # Product requirements
│   ├── qa/             # Quality assurance
│   └── stories/        # Development stories
├── public/             # Static assets
├── src/                # Source code
│   ├── components/     # React components
│   │   ├── features/   # Business logic components
│   │   ├── layout/     # Layout components
│   │   └── ui/         # Reusable UI primitives
│   ├── config/         # Application configuration
│   │   └── env.ts      # Environment variables
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── services/       # API integration
│   ├── styles/         # Global styles
│   │   └── globals.css # Tailwind CSS directives
│   ├── test/           # Test utilities
│   │   └── setup.ts    # Test configuration
│   ├── types/          # TypeScript definitions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── .eslintrc.cjs       # ESLint configuration
├── .gitignore          # Git ignore rules
├── .nvmrc              # Node version specification
├── .prettierrc         # Prettier configuration
├── index.html          # HTML entry point
├── package.json        # Project dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── vercel.json         # Vercel deployment configuration
├── vite.config.ts      # Vite build configuration
└── vitest.config.ts    # Vitest test configuration
```

## Technology Stack

### Core Framework
- **Vite** (5.2.x) - Fast build tool and development server
- **React** (18.3.x) - UI framework
- **TypeScript** (5.4.x) - Type-safe JavaScript

### UI & Styling
- **Tailwind CSS** (3.4.x) - Utility-first CSS framework
- **Radix UI** (1.1.x) - Accessible component primitives
- **Framer Motion** (11.2.x) - Animation library
- **react-feather** (2.0.x) - Icon library
- **class-variance-authority** - Component style variants

### State & Forms
- **React Hook Form** (7.51.x) - Form state management
- **react-dropzone** (14.2.x) - File upload handling
- **TanStack Query** (5.x) - Server state management
- **Zod** - Schema validation

### Development Tools
- **Vitest** (1.6.x) - Test runner
- **React Testing Library** (15.0.x) - Component testing
- **ESLint** (8.57.x) - Code linting
- **Prettier** (3.2.x) - Code formatting

## Deployment

### Vercel Deployment

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Follow the prompts to link your project and deploy.

3. **Environment Variables**:
   Set the following in your Vercel dashboard:
   - `VITE_API_URL` - Your API endpoint URL
   - `VITE_APP_ENV` - Environment (production/staging)

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## API Endpoints

### Health Check
- **URL**: `/api/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "ok",
    "message": "Health check passed",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development",
    "version": "0.1.0"
  }
  ```

## Development Guidelines

### Component Architecture
- **UI Components** (`src/components/ui/`): Stateless, reusable primitives
- **Layout Components** (`src/components/layout/`): Page structure components
- **Feature Components** (`src/components/features/`): Business logic components

### Best Practices
1. Use TypeScript for all new files
2. Follow the established file structure
3. Write tests for critical functionality
4. Use Tailwind utility classes for styling
5. Access environment variables through `src/config/env.ts`
6. Make API calls through `src/services/` functions

### Git Workflow
1. Create feature branches from `main`
2. Follow conventional commit messages
3. Ensure all tests pass before merging
4. Keep commits focused and atomic

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Change the port in vite.config.ts
# Or kill the process using port 3000
lsof -ti:3000 | xargs kill
```

**Dependencies not installing**:
```bash
# Clear npm cache
npm cache clean --force
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**:
```bash
# Run type checking
npm run typecheck
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For issues or questions, please contact the development team or create an issue in the project repository.