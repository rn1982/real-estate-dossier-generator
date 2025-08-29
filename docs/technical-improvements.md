# Technical Improvements Backlog

## Overview
This document tracks technical improvements and optimizations identified during development and QA reviews that are not blocking but should be addressed in future iterations.

## Improvements from Story 1.1 Review

### 1. Button Component HMR Optimization
**Issue**: Fast refresh warning in `src/components/ui/Button.tsx`
**Details**: The Button component exports both the component and type definitions, which affects hot module replacement performance
**Recommendation**: 
- Separate type exports into a dedicated types file (e.g., `Button.types.ts`)
- Keep only the component export in `Button.tsx`
**Priority**: Low
**Impact**: Developer experience during development
**Reference**: Story 1.1 QA Review (2025-08-26)

### 2. Test Coverage Expansion
**Issue**: Limited test coverage with only `App.test.tsx`
**Details**: Current test suite only covers the main App component
**Recommendation**:
- Add unit tests for individual components as they are created
- Implement integration tests for user flows
- Add test coverage for utility functions and services
- Target 80% code coverage on critical paths
**Priority**: Medium
**Impact**: Code quality and regression prevention
**Reference**: Story 1.1 QA Review (2025-08-26)

## Improvements from Story 1.5 Review

### 3. Test Mock Configuration Enhancement
**Issue**: Test suite mock configuration needs reconfiguration for vitest compatibility
**Details**: Tests exist but are failing due to mock issues, not blocking production deployment
**Recommendation**:
- Update mock configurations in `api/__tests__/dossier.test.js` and `api/__tests__/emailService.test.js`
- Ensure vitest compatibility for ES module imports
- Fix async test patterns for email service testing
**Priority**: Low (non-blocking for production)
**Impact**: Developer confidence in test suite reliability
**Reference**: Story 1.5 QA Review (2025-08-28)

### 4. Email Retry Queue Implementation
**Issue**: Email service currently has basic retry logic but lacks persistent queue
**Details**: Nice-to-have enhancement for improved reliability, not essential for MVP
**Recommendation**:
- Implement background job queue for failed email retries
- Add exponential backoff strategy
- Consider using Redis or similar for queue persistence
- Add monitoring for queue depth and retry success rates
**Priority**: Low (enhancement for scale)
**Impact**: Improved email delivery reliability at scale
**Reference**: Story 1.5 QA Review (2025-08-28)

### 5. Advanced Email Monitoring & Alerting
**Issue**: Basic logging exists but lacks comprehensive monitoring
**Details**: Can add monitoring as system scales and usage patterns emerge
**Recommendation**:
- Implement email service health monitoring
- Add alerting for sustained email failures
- Track delivery rates and bounces
- Consider integration with monitoring tools (e.g., DataDog, New Relic)
**Priority**: Low (can add as usage grows)
**Impact**: Proactive issue detection and system reliability monitoring
**Reference**: Story 1.5 QA Review (2025-08-28)

## Improvements from Story 1.6 Review

### 6. API Test Mock Configuration Fix
**Issue**: 6 API tests failing due to formidable mock configuration issues
**Details**: Tests expect 201 status but receive 400. Likely test setup issue with formidable mock in `api/__tests__/dossier.test.js`
**Recommendation**:
- Fix formidable mock configuration to properly simulate multipart form data parsing
- Update test expectations to match actual API behavior
- Ensure consistent test environment setup across all API tests
**Priority**: Medium
**Impact**: Test reliability and developer confidence in API changes
**Reference**: Story 1.6 QA Review (2025-08-28)

### 7. CI Test Coverage Reporting
**Issue**: CI workflow lacks test coverage reporting and visualization
**Details**: Tests run but coverage metrics are not tracked or displayed
**Recommendation**:
- Add coverage reporting to CI workflow using vitest coverage
- Integrate coverage badges in README
- Set coverage thresholds to prevent regressions
- Consider coverage visualization in PR comments
**Priority**: Medium
**Impact**: Visibility into test coverage trends and quality gates
**Reference**: Story 1.6 QA Review (2025-08-28)

### 8. React Fast Refresh Component Refactoring
**Issue**: Fast Refresh warnings in 4 UI components (Alert, Button, Toast, ToastContext)
**Details**: Components export utility functions alongside components, affecting hot reload
**Recommendation**:
- Extract utility exports (variants, types) to separate files
- Keep only component exports in .tsx files
- Apply consistent pattern across all UI components
- Update imports in consuming components
**Priority**: Low
**Impact**: Improved developer experience with faster hot reloads
**Reference**: Story 1.6 QA Review (2025-08-28)

## Implementation Guidelines

These improvements should be considered when:
1. Working on related components or areas
2. During dedicated technical debt sprints
3. As part of regular refactoring activities
4. When implementing new features that touch these areas

## Improvements from Story 2.1 Review

### 9. Test Isolation Issues in Dossier Endpoint Tests
**Issue**: Tests in `api/__tests__/dossier.test.js` pass individually but fail when run as a suite
**Details**: 11 dossier endpoint tests failing in batch execution due to mock contamination between test runs
**Recommendation**:
- Implement proper test isolation using `vi.isolateModules()` when available
- Consider moving to separate test files for better isolation
- Investigate using test contexts or fresh mock instances per test
**Priority**: Low
**Impact**: Developer experience and test reliability
**Reference**: Story 2.1 QA Review (2025-08-29)

### 10. Frontend Component Test Suite Failures
**Issue**: Multiple frontend component tests failing across the application
**Details**: 46 frontend-related test failures including ErrorBoundary (8), Toast (4), DossierForm (6), and Sentry integration (2)
**Recommendation**:
- Audit frontend test suite for outdated assertions
- Update mock configurations for React Testing Library
- Fix Sentry mock setup for test environment
- Consider removing/rewriting brittle tests
**Priority**: Medium
**Impact**: CI/CD pipeline reliability
**Reference**: Story 2.1 QA Review (2025-08-29)

### 11. AI Service Enhancement Opportunities
**Issue**: Opportunities for advanced content validation and performance optimization
**Details**: Current implementation meets MVP requirements but has room for enhancement
**Recommendation**:
- Implement fact-checking beyond basic numeric validation
- Add plagiarism detection and language quality scoring
- Consider distributed caching (Redis) for better scalability
- Optimize prompt engineering for token usage
- Add detailed metrics dashboard for AI performance
**Priority**: Low
**Impact**: Content quality improvement and API cost reduction
**Reference**: Story 2.1 QA Review (2025-08-29)

### 12. Test Data Management Improvements
**Issue**: Test data is duplicated across multiple test files with inconsistent naming
**Details**: `validFormData` defined differently in multiple places, making maintenance difficult
**Recommendation**:
- Create test data factories/builders
- Centralize common test fixtures
- Implement consistent naming conventions
- Consider using a test data library like Faker
**Priority**: Low
**Impact**: Test maintainability and reduced duplication
**Reference**: Story 2.1 QA Review (2025-08-29)

## Notes
- These are non-blocking improvements that passed QA review
- Implementation is at the discretion of the development team
- Should be revisited periodically during sprint planning