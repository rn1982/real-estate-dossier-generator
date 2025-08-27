# 11. Frontend Developer Standards

## Critical Coding Rules

- **Component Architecture**: Adhere to the ui, layout, and features classification.
- **State Management**: Separate UI state (react-hook-form) from server state (TanStack Query).
- **API Integration**: All API calls must be made through functions in the src/services/ directory.
- **Environment Configuration**: Access variables only through the type-safe env object.
- **Styling**: Use only Tailwind CSS utility classes derived from the theme.
- **Accessibility**: Use accessible primitives and ensure all inputs have labels.

## Quick Reference

- **Commands**: npm run dev, npm run build, npm run test
- **Path Alias**: @/ will be configured as an alias for the src/ directory.
- **Key Patterns**: Use cva for component style variants and useMutation for API calls.