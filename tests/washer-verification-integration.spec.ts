import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test data and utilities
const TEST_USER = {
  email: 'test-washer@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Washer'
}

const MOCK_STRIPE_RESPONSES = {
  account_incomplete: {
    id: 'acct_test_incomplete',
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: false,
    requirements: {
      currently_due: ['individual.first_name', 'individual.last_name'],
      eventually_due: ['individual.id_number'],
      past_due: [],
      pending_verification: []
    }
  },
  account_pending: {
    id: 'acct_test_pending',
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: true,
    requirements: {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: ['individual.verification.document']
    }
  },
  account_complete: {
    id: 'acct_test_complete',
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
    requirements: {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: []
    }
  },
  account_requires_action: {
    id: 'acct_test_requires_action',
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: true,
    requirements: {
      currently_due: ['individual.verification.additional_document'],
      eventually_due: [],
      past_due: [],
      pending_verification: []
    }
  },
  account_rejected: {
    id: 'acct_test_rejected',
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: true,
    requirements: {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
      disabled_reason: 'rejected.fraud'
    }
  }
}

// Helper functions
async function setupMockStripeResponses(page: Page, accountStatus: keyof typeof MOCK_STRIPE_RESPONSES) {
  await page.route('**/api/stripe/**', async (route) => {
    const url = route.request().url()
    
    if (url.includes('/accounts/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STRIPE_RESPONSES[accountStatus])
      })
    } else if (url.includes('/account_links')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://connect.stripe.com/setup/test_onboarding_link'
        })
      })
    } else {
      await route.continue()
    }
  })
}

async function createTestWasher(page: Page) {
  // Navigate to signup
  await page.goto('/signup')
  
  // Fill out signup form
  await page.fill('[data-testid="email-input"]', TEST_USER.email)
  await page.fill('[data-testid="password-input"]', TEST_USER.password)
  await page.fill('[data-testid="first-name-input"]', TEST_USER.firstName)
  await page.fill('[data-testid="last-name-input"]', TEST_USER.lastName)
  
  // Select washer role
  await page.check('[data-testid="role-washer"]')
  
  // Submit form
  await page.click('[data-testid="signup-submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/washer/dashboard**')
}

async function loginAsWasher(page: Page) {
  await page.goto('/signin')
  await page.fill('[data-testid="email-input"]', TEST_USER.email)
  await page.fill('[data-testid="password-input"]', TEST_USER.password)
  await page.click('[data-testid="signin-submit"]')
  await page.waitForURL('**/washer/dashboard**')
}

test.describe('Washer Verification Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/')
  })

  test.describe('End-to-End Washer Verification Journey', () => {
    test('should complete full verification flow for new washer', async ({ page }) => {
      // Mock Stripe responses for incomplete account initially
      await setupMockStripeResponses(page, 'account_incomplete')
      
      // Create new washer account
      await createTestWasher(page)
      
      // Should see verification container
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      await expect(page.locator('text=Complete Your Washer Verification')).toBeVisible()
      
      // Verify onboarding steps are displayed
      await expect(page.locator('text=Identity Verification')).toBeVisible()
      await expect(page.locator('text=Payment Setup')).toBeVisible()
      await expect(page.locator('text=Business Information')).toBeVisible()
      
      // Click start verification
      await page.click('[data-testid="start-verification-btn"]')
      
      // Should show loading state
      await expect(page.locator('text=Starting Verification...')).toBeVisible()
      
      // Mock redirect to Stripe (in real test, this would redirect)
      await page.route('https://connect.stripe.com/setup/**', async (route) => {
        // Simulate Stripe onboarding completion by redirecting back
        await route.fulfill({
          status: 302,
          headers: {
            'Location': '/washer/dashboard?connect_success=true'
          }
        })
      })
      
      // Wait for redirect back from Stripe
      await page.waitForURL('**/washer/dashboard?connect_success=true')
      
      // Update mock to pending status
      await setupMockStripeResponses(page, 'account_pending')
      
      // Should now see status banner instead of full container
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
      await expect(page.locator('text=Verification Under Review')).toBeVisible()
      
      // Should see limited dashboard content
      await expect(page.locator('text=Verification in Progress')).toBeVisible()
      await expect(page.locator('text=View and accept available bookings')).toBeVisible()
      
      // Update mock to complete status
      await setupMockStripeResponses(page, 'account_complete')
      
      // Refresh page to trigger status update
      await page.reload()
      
      // Should now have full access
      await expect(page.locator('[data-testid="verification-status-banner"]')).not.toBeVisible()
      await expect(page.locator('text=Available Bookings')).toBeVisible()
      await expect(page.locator('text=My Bookings')).toBeVisible()
      await expect(page.locator('text=Payouts')).toBeVisible()
    })

    test('should handle verification with required actions', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_requires_action')
      await createTestWasher(page)
      
      // Should see status banner with action required
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
      await expect(page.locator('text=Action Required')).toBeVisible()
      await expect(page.locator('text=Additional information is needed')).toBeVisible()
      
      // Should show specific requirements
      await expect(page.locator('text=Required now:')).toBeVisible()
      await expect(page.locator('text=individual verification additional document')).toBeVisible()
      
      // Should have continue verification button
      await expect(page.locator('[data-testid="continue-verification-btn"]')).toBeVisible()
      
      // Click continue verification
      await page.click('[data-testid="continue-verification-btn"]')
      
      // Should show loading state
      await expect(page.locator('text=Loading...')).toBeVisible()
    })

    test('should handle rejected verification status', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_rejected')
      await createTestWasher(page)
      
      // Should see status banner with rejection info
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
      await expect(page.locator('text=Verification Issues')).toBeVisible()
      await expect(page.locator('text=There were issues with your verification')).toBeVisible()
      
      // Should show disabled reason
      await expect(page.locator('text=Issue:')).toBeVisible()
      await expect(page.locator('text=rejected.fraud')).toBeVisible()
      
      // Should have contact support button
      await expect(page.locator('[data-testid="contact-support-btn"]')).toBeVisible()
      
      // Should not have continue verification button
      await expect(page.locator('[data-testid="continue-verification-btn"]')).not.toBeVisible()
    })
  })

  test.describe('Verification Status Updates and UI Changes', () => {
    test('should update UI when verification status changes', async ({ page }) => {
      // Start with incomplete status
      await setupMockStripeResponses(page, 'account_incomplete')
      await createTestWasher(page)
      
      // Should see verification container
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      // Update to pending status
      await setupMockStripeResponses(page, 'account_pending')
      
      // Trigger status refresh
      await page.click('[data-testid="refresh-status-btn"]')
      
      // Should now see status banner
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
      await expect(page.locator('text=Verification Under Review')).toBeVisible()
      
      // Update to complete status
      await setupMockStripeResponses(page, 'account_complete')
      
      // Trigger another refresh
      await page.click('[data-testid="refresh-status-btn"]')
      
      // Should now have full dashboard access
      await expect(page.locator('[data-testid="verification-status-banner"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    })

    test('should show toast notifications for status changes', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_pending')
      await createTestWasher(page)
      
      // Update to complete status
      await setupMockStripeResponses(page, 'account_complete')
      
      // Trigger status update
      await page.click('[data-testid="refresh-status-btn"]')
      
      // Should see success toast
      await expect(page.locator('[data-testid="toast-notification"]')).toBeVisible()
      await expect(page.locator('text=Verification Complete')).toBeVisible()
    })
  })

  test.describe('Access Control After Verification Completion', () => {
    test('should allow access to all washer features when verified', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_complete')
      await createTestWasher(page)
      
      // Should have access to all washer pages
      await page.goto('/washer/dashboard/available-bookings')
      await expect(page.locator('[data-testid="available-bookings-page"]')).toBeVisible()
      
      await page.goto('/washer/dashboard/bookings')
      await expect(page.locator('[data-testid="my-bookings-page"]')).toBeVisible()
      
      await page.goto('/washer/dashboard/payouts')
      await expect(page.locator('[data-testid="payouts-page"]')).toBeVisible()
    })

    test('should restrict access to washer features when unverified', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_incomplete')
      await createTestWasher(page)
      
      // Try to access restricted pages directly
      await page.goto('/washer/dashboard/available-bookings')
      
      // Should be redirected or see verification container
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      await page.goto('/washer/dashboard/bookings')
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      await page.goto('/washer/dashboard/payouts')
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
    })

    test('should update access permissions when verification completes', async ({ page }) => {
      // Start unverified
      await setupMockStripeResponses(page, 'account_incomplete')
      await createTestWasher(page)
      
      // Verify restricted access
      await page.goto('/washer/dashboard/available-bookings')
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      // Complete verification
      await setupMockStripeResponses(page, 'account_complete')
      
      // Trigger status update
      await page.goto('/washer/dashboard')
      await page.click('[data-testid="refresh-status-btn"]')
      
      // Now should have access
      await page.goto('/washer/dashboard/available-bookings')
      await expect(page.locator('[data-testid="available-bookings-page"]')).toBeVisible()
    })
  })

  test.describe('Error Scenarios and Recovery Flows', () => {
    test('should handle Stripe API errors gracefully', async ({ page }) => {
      // Mock Stripe API error
      await page.route('**/api/stripe/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })
      
      await createTestWasher(page)
      
      // Should see error state
      await expect(page.locator('[data-testid="error-alert"]')).toBeVisible()
      await expect(page.locator('text=An unexpected error occurred')).toBeVisible()
      
      // Should have retry button
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
      
      // Fix the API and retry
      await setupMockStripeResponses(page, 'account_incomplete')
      await page.click('[data-testid="retry-btn"]')
      
      // Should now work
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
    })

    test('should handle network errors with retry mechanism', async ({ page }) => {
      let attemptCount = 0
      
      await page.route('**/api/stripe/**', async (route) => {
        attemptCount++
        if (attemptCount < 3) {
          // Fail first 2 attempts
          await route.abort('failed')
        } else {
          // Succeed on 3rd attempt
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_STRIPE_RESPONSES.account_incomplete)
          })
        }
      })
      
      await createTestWasher(page)
      
      // Should eventually succeed after retries
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      // Verify retry attempts were made
      expect(attemptCount).toBe(3)
    })

    test('should recover from incomplete verification attempts', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_incomplete')
      await createTestWasher(page)
      
      // Start verification process
      await page.click('[data-testid="start-verification-btn"]')
      
      // Simulate interruption (page refresh)
      await page.reload()
      
      // Should show recovery option
      await expect(page.locator('[data-testid="recovery-alert"]')).toBeVisible()
      await expect(page.locator('text=Resume Verification')).toBeVisible()
      
      // Should have continue and start fresh options
      await expect(page.locator('[data-testid="continue-verification-btn"]')).toBeVisible()
      await expect(page.locator('[data-testid="start-fresh-btn"]')).toBeVisible()
      
      // Test continue option
      await page.click('[data-testid="continue-verification-btn"]')
      await expect(page.locator('text=Starting Verification...')).toBeVisible()
    })

    test('should handle expired verification links', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_requires_action')
      await createTestWasher(page)
      
      // Mock expired link error
      await page.route('**/account_links', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              type: 'invalid_request_error',
              code: 'account_link_expired'
            }
          })
        })
      })
      
      // Try to continue verification
      await page.click('[data-testid="continue-verification-btn"]')
      
      // Should show error about expired link
      await expect(page.locator('[data-testid="error-alert"]')).toBeVisible()
      await expect(page.locator('text=verification link has expired')).toBeVisible()
      
      // Should automatically generate new link
      await setupMockStripeResponses(page, 'account_requires_action')
      await page.click('[data-testid="retry-btn"]')
      
      // Should work with new link
      await expect(page.locator('text=Loading...')).toBeVisible()
    })
  })

  test.describe('Callback Handling and Status Synchronization', () => {
    test('should handle verification completion callback', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_pending')
      await createTestWasher(page)
      
      // Simulate return from Stripe with success callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should trigger status update
      await expect(page.locator('[data-testid="callback-processing"]')).toBeVisible()
      
      // Update mock to complete status
      await setupMockStripeResponses(page, 'account_complete')
      
      // Should update UI to show completion
      await expect(page.locator('[data-testid="verification-complete-toast"]')).toBeVisible()
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    })

    test('should synchronize status with Stripe API', async ({ page }) => {
      // Start with cached incomplete status
      await setupMockStripeResponses(page, 'account_incomplete')
      await createTestWasher(page)
      
      // Update Stripe API to return complete status
      await setupMockStripeResponses(page, 'account_complete')
      
      // Trigger status sync
      await page.click('[data-testid="refresh-status-btn"]')
      
      // Should update local status to match Stripe
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
      
      // Verify status was persisted
      await page.reload()
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    })

    test('should handle callback processing errors', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_pending')
      await createTestWasher(page)
      
      // Mock callback processing error
      await page.route('**/api/verification/callback', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Callback processing failed' })
        })
      })
      
      // Simulate callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should show error state
      await expect(page.locator('[data-testid="callback-error"]')).toBeVisible()
      await expect(page.locator('text=Failed to process verification callback')).toBeVisible()
      
      // Should have retry option
      await expect(page.locator('[data-testid="retry-callback-btn"]')).toBeVisible()
    })

    test('should handle multiple concurrent status updates', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_pending')
      await createTestWasher(page)
      
      // Trigger multiple status updates simultaneously
      const refreshPromises = [
        page.click('[data-testid="refresh-status-btn"]'),
        page.click('[data-testid="refresh-status-btn"]'),
        page.click('[data-testid="refresh-status-btn"]')
      ]
      
      await Promise.all(refreshPromises)
      
      // Should handle gracefully without errors
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
      
      // Should not show multiple loading states
      const loadingElements = await page.locator('text=Refreshing...').count()
      expect(loadingElements).toBeLessThanOrEqual(1)
    })
  })

  test.describe('Mobile and Responsive Behavior', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await setupMockStripeResponses(page, 'account_incomplete')
      await createTestWasher(page)
      
      // Should show mobile-optimized verification container
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      // Verification steps should be stacked vertically on mobile
      const stepsContainer = page.locator('[data-testid="verification-steps"]')
      await expect(stepsContainer).toHaveCSS('flex-direction', 'column')
      
      // Start verification button should be full width on mobile
      const startButton = page.locator('[data-testid="start-verification-btn"]')
      await expect(startButton).toHaveCSS('width', '100%')
    })

    test('should handle mobile navigation during verification', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await setupMockStripeResponses(page, 'account_pending')
      await createTestWasher(page)
      
      // Should show mobile header with menu
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-menu-trigger"]')).toBeVisible()
      
      // Open mobile menu
      await page.click('[data-testid="mobile-menu-trigger"]')
      
      // Should show sidebar in mobile sheet
      await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible()
      
      // Navigation items should be disabled for unverified washer
      await expect(page.locator('[data-testid="nav-available-bookings"]')).toHaveAttribute('aria-disabled', 'true')
    })
  })

  test.describe('Performance and Loading States', () => {
    test('should show appropriate loading states during verification', async ({ page }) => {
      await setupMockStripeResponses(page, 'account_incomplete')
      await createTestWasher(page)
      
      // Click start verification
      await page.click('[data-testid="start-verification-btn"]')
      
      // Should show loading stages
      await expect(page.locator('text=Setting up your verification process...')).toBeVisible()
      await expect(page.locator('text=Creating your secure payment account...')).toBeVisible()
      await expect(page.locator('text=Creating your verification link...')).toBeVisible()
      await expect(page.locator('text=Taking you to the verification process...')).toBeVisible()
    })

    test('should handle slow API responses gracefully', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/stripe/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_STRIPE_RESPONSES.account_incomplete)
        })
      })
      
      await createTestWasher(page)
      
      // Should show loading state during slow response
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
      
      // Should eventually load content
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible({ timeout: 10000 })
    })
  })
})