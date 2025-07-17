# Washer Verification Integration Tests

This document describes the comprehensive integration test suite for the washer verification flow, covering all aspects of the Stripe Connect KYC onboarding system.

## Test Coverage Overview

The integration test suite covers all requirements from the specification and includes the following test categories:

### 1. End-to-End Verification Journey Tests
- **Complete verification flow for new washer**: Tests the full journey from unverified to verified status
- **Verification with required actions**: Tests handling of incomplete verification requiring additional information
- **Rejected verification status**: Tests proper handling of rejected verification attempts

### 2. Verification Status Updates and UI Changes
- **Status change UI updates**: Verifies UI updates when verification status changes
- **Toast notifications**: Tests status change notifications to users
- **Real-time status synchronization**: Tests synchronization with Stripe API

### 3. Access Control After Verification Completion
- **Verified washer access**: Tests full access to washer features when verified
- **Unverified washer restrictions**: Tests access restrictions for unverified washers
- **Dynamic access permission updates**: Tests access changes when verification completes

### 4. Error Scenarios and Recovery Flows
- **Stripe API errors**: Tests graceful handling of various Stripe API errors
- **Network errors with retry**: Tests network error handling and retry mechanisms
- **Incomplete verification recovery**: Tests recovery from interrupted verification attempts
- **Expired verification links**: Tests handling of expired Stripe onboarding links

### 5. Callback Handling and Status Synchronization
- **Verification completion callbacks**: Tests processing of Stripe callback URLs
- **Status synchronization**: Tests keeping local status in sync with Stripe
- **Callback processing errors**: Tests error handling during callback processing
- **Concurrent status updates**: Tests handling of multiple simultaneous status updates

### 6. Mobile and Responsive Behavior
- **Mobile device compatibility**: Tests verification flow on mobile devices
- **Mobile navigation**: Tests mobile-specific navigation during verification
- **Responsive design**: Tests UI adaptation to different screen sizes

### 7. Performance and Loading States
- **Loading state management**: Tests appropriate loading indicators during verification
- **Slow API response handling**: Tests graceful handling of slow network responses
- **Performance optimization**: Tests caching and optimization strategies

## Test Files Structure

### Primary Integration Test Files

1. **`tests/washer-verification-integration.spec.ts`**
   - Main integration test file covering end-to-end flows
   - Tests complete verification journey from start to finish
   - Covers all major user scenarios and edge cases

2. **`tests/washer-verification-error-scenarios.spec.ts`**
   - Focused on error handling and recovery scenarios
   - Tests various Stripe API errors and network issues
   - Covers retry mechanisms and error recovery flows

3. **`tests/washer-verification-callback-handling.spec.ts`**
   - Specialized tests for callback processing and status synchronization
   - Tests webhook handling and real-time updates
   - Covers audit logging and compliance requirements

4. **`tests/washer-verification-components.spec.ts`**
   - Component-level integration tests
   - Tests individual verification components in isolation
   - Covers UI state management and user interactions

## Test Utilities and Mocking

### Mock Data Structures
```typescript
const MOCK_STRIPE_RESPONSES = {
  account_incomplete: { /* Unverified account data */ },
  account_pending: { /* Verification in progress */ },
  account_complete: { /* Fully verified account */ },
  account_requires_action: { /* Additional info needed */ },
  account_rejected: { /* Verification failed */ }
}
```

### Helper Functions
- `setupMockStripeResponses()`: Configures Stripe API mocks
- `createTestWasher()`: Creates test washer account
- `mockCallbackAPI()`: Mocks verification callback processing
- `mockStripeError()`: Simulates various error conditions

## Key Test Scenarios

### 1. Complete Verification Flow
```typescript
test('should complete full verification flow for new washer', async ({ page }) => {
  // 1. Start with unverified washer
  // 2. Show verification container
  // 3. Start verification process
  // 4. Handle Stripe redirect
  // 5. Process callback
  // 6. Update to verified status
  // 7. Show full dashboard access
})
```

### 2. Error Recovery
```typescript
test('should recover from incomplete verification attempts', async ({ page }) => {
  // 1. Start verification
  // 2. Simulate interruption
  // 3. Show recovery options
  // 4. Allow continuation or restart
  // 5. Complete verification successfully
})
```

### 3. Status Synchronization
```typescript
test('should synchronize status with Stripe API', async ({ page }) => {
  // 1. Start with cached status
  // 2. Update Stripe API status
  // 3. Trigger status refresh
  // 4. Update local status
  // 5. Persist changes
})
```

## Test Data and Fixtures

### Test User Data
```typescript
const TEST_USER = {
  email: 'test-washer@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Washer'
}
```

### Mock Stripe Account States
- **Incomplete**: No verification started
- **Pending**: Verification submitted, under review
- **Complete**: Fully verified and active
- **Requires Action**: Additional information needed
- **Rejected**: Verification failed

## Component Test IDs

All components include test IDs for reliable test automation:

### Verification Container
- `[data-testid="verification-container"]`
- `[data-testid="start-verification-btn"]`
- `[data-testid="verification-steps"]`

### Status Banner
- `[data-testid="verification-status-banner"]`
- `[data-testid="continue-verification-btn"]`
- `[data-testid="refresh-status-btn"]`
- `[data-testid="contact-support-btn"]`

### Error Handling
- `[data-testid="error-alert"]`
- `[data-testid="retry-btn"]`
- `[data-testid="recovery-alert"]`

### Dashboard Elements
- `[data-testid="washer-dashboard-content"]`
- `[data-testid="verification-in-progress-content"]`

## Running the Tests

### Full Integration Test Suite
```bash
npx playwright test tests/washer-verification-integration.spec.ts
```

### Error Scenario Tests
```bash
npx playwright test tests/washer-verification-error-scenarios.spec.ts
```

### Callback Handling Tests
```bash
npx playwright test tests/washer-verification-callback-handling.spec.ts
```

### Component Integration Tests
```bash
npx playwright test tests/washer-verification-components.spec.ts
```

### All Verification Tests
```bash
npx playwright test tests/washer-verification-*.spec.ts
```

## Test Environment Setup

### Prerequisites
- Next.js development server running on localhost:3000
- Supabase test database configured
- Stripe test API keys configured
- Playwright browsers installed

### Configuration
Tests use the existing `playwright.config.ts` configuration with:
- Multiple browser support (Chromium, Firefox, WebKit)
- Automatic dev server startup
- Trace collection on failures
- HTML reporting

## Continuous Integration

### Test Execution
- Tests run on all supported browsers
- Parallel execution for faster feedback
- Retry on failure for flaky test handling
- Comprehensive error reporting

### Coverage Requirements
- All verification flow paths tested
- All error scenarios covered
- All user interaction patterns validated
- All API integration points verified

## Maintenance and Updates

### Adding New Tests
1. Follow existing test structure and naming conventions
2. Use appropriate test utilities and mocks
3. Include proper test IDs in components
4. Document new test scenarios

### Updating Existing Tests
1. Maintain backward compatibility
2. Update mock data when API changes
3. Verify test coverage remains comprehensive
4. Update documentation as needed

## Compliance and Audit

### Audit Logging Tests
- Verification event logging
- Status change tracking
- Error event recording
- Compliance requirement validation

### Security Tests
- Input validation testing
- XSS prevention verification
- Authentication requirement testing
- Authorization boundary testing

## Performance Testing

### Load Testing Scenarios
- Multiple concurrent verification attempts
- High-frequency status updates
- Large-scale callback processing
- API rate limiting handling

### Performance Metrics
- Page load times during verification
- API response time handling
- UI responsiveness during loading
- Memory usage optimization

This comprehensive test suite ensures the washer verification system is robust, reliable, and provides an excellent user experience across all scenarios and edge cases.