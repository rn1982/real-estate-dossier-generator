# 9. Testing Requirements

We will use Vitest and React Testing Library.

## Testing Best Practices

- **Test User Behavior, Not Implementation**: Focus on what the user sees and does.
- **Unit & Integration Tests**: UI primitives will have unit tests. Feature components will have integration tests.
- **End-to-End (E2E) Tests**: The core form submission flow will be covered by an E2E test using Playwright.
- **Mock External Dependencies**: API calls will be mocked using MSW (Mock Service Worker).
- **Code Coverage**: Aim for a minimum of 80% code coverage.
