import { test, expect, Page } from '@playwright/test'

// Test utilities for error scenarios
async function mockStripeError(page: Page, errorType: string, errorCode?: string) {
  await page.route('**/api/stripe/**', async (route) => {
    const errorResponse = {
      error: {
        type: errorType,
        code: errorCode,
        message: getErrorMessage(errorType, errorCode)
      }
    }
    
    await route.fulfill({
      status: errorType === 'network_error' ? 0 : 400,
      contentType: 'application/json',
      body: JSON.stringify(errorResponse)
    })
  })
}

function getErrorMessage(errorType: string, errorCode?: string): string {
  switch (errorType) {
    case 'card_error':
      return 'Your card was declined.'
    case 'rate_limit_error':
      return 'Too many requests made to the API too quickly.'
    case 'invalid_request_error':
      if (errorCode === 'account_invalid') return 'The account ID is invalid.'
      if (errorCode === 'account_link_expired') return 'The account link has expired.'
      return 'Invalid request parameters.'
    case 'api_error':
      return 'An error occurred with our API.'
    case 'authentication_error':
      return 'Authentication with Stripe failed.'
    case 'network_error':
      return 'Network connection failed.'
    default:
      return 'An unknown error occurred.'
  }
}

async function createTestWasher(page: Page) {
  await page.goto('/signup')
  await page.fill('[data-testid="email-input"]', 'test-washer@example.com')
  await page.fill('[data-testid="password-input"]', 'TestPassword123!')
  await page.fill('[data-testid="first-name-input"]', 'Test')
  await page.fill('[data-testid="last-name-input"]', 'Washer')
  await page.check('[data-testid="role-washer"]')
  await page.click('[data-testid="signup-submit"]')
  await page.waitForURL('**/washer/dashboard**')
}

test.describe('Washer Verification Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Stripe API Errors', () => {
    test('should handle invalid account ID error', async ({ page }) => {
      await mockStripeError(page, 'invalid_request_error', 'account_invalid')
      await createTestWasher(page)
      
      // Should show error message
      await expect(page.locator('[data-testid="error-alert"]')).toBeVisible()
      await expect(page.locator('text=The account ID is invalid')).toBeVisible()
      
      // Should have retry option
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
    })

    test('should handle expired account link error', async ({ page }) => {
      await mockStripeError(page, 'invalid_request_error', 'account_link_expired')
      await createTestWasher(page)
      
      // Try to continue verification
      await page.click('[data-testid="start-verification-btn"]')
      
      // Should show expired link error
      await expect(page.locator('text=The account link has expired')).toBeVisible()
      
      // Should automatically retry with new link
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
    })

    test('should handle rate limiting errors', async ({ page }) => {
      await mockStripeError(page, 'rate_limit_error')
      await createTestWasher(page)
      
      // Should show rate limit error
      await expect(page.locator('text=Too many requests made to the API')).toBeVisible()
      
      // Should have retry with backoff
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
      
      // Click retry
      await page.click('[data-testid="retry-btn"]')
      
      // Should show retry attempt
      await expect(page.locator('text=Retrying...')).toBeVisible()
    })

    test('should handle authentication errors', async ({ page }) => {
      await mockStripeError(page, 'authentication_error')
      await createTestWasher(page)
      
      // Should show authentication error
      await expect(page.locator('text=Authentication with Stripe failed')).toBeVisible()
      
      // Should suggest contacting support
      await expect(page.locator('text=contact support')).toBeVisible()
    })

    test('should handle general API errors', async ({ page }) => {
      await mockStripeError(page, 'api_error')
      await createTestWasher(page)
      
      // Should show generic API error
      await expect(page.locator('text=An error occurred with our API')).toBeVisible()
      
      // Should have retry option
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
    })
  })

  test.describe('Network Errors', () => {
    test('should handle network connection failures', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/stripe/**', async (route) => {
        await route.abort('failed')
      })
      
      await createTestWasher(page)
      
      // Should show network error
      await expect(page.locator('text=Network connection error')).toBeVisible()
      
      // Should have retry option
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
    })

    test('should handle timeout errors', async ({ page }) => {
      // Mock slow response that times out
      await page.route('**/api/stripe/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 30000)) // 30 second delay
        await route.continue()
      })
      
      await createTestWasher(page)
      
      // Should show timeout error after reasonable wait
      await expect(page.locator('text=Request timed out')).toBeVisible({ timeout: 10000 })
      
      // Should have retry option
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
    })

    test('should handle intermittent network issues with retry', async ({ page }) => {
      let attemptCount = 0
      
      await page.route('**/api/stripe/**', async (route) => {
        attemptCount++
        if (attemptCount <= 2) {
          // Fail first 2 attempts
          await route.abort('failed')
        } else {
          // Succeed on 3rd attempt
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'acct_test_success',
              charges_enabled: false,
              payouts_enabled: false,
              details_submitted: false
            })
          })
        }
      })
      
      await createTestWasher(page)
      
      // Should eventually succeed after retries
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      // Verify retry attempts were made
      expect(attemptCount).toBe(3)
    })
  })

  test.describe('Recovery Mechanisms', () => {
    test('should recover from browser refresh during verification', async ({ page }) => {
      await createTestWasher(page)
      
      // Start verification process
      await page.click('[data-testid="start-verification-btn"]')
      
      // Wait for loading to start
      await expect(page.locator('text=Starting Verification...')).toBeVisible()
      
      // Simulate browser refresh
      await page.reload()
      
      // Should show recovery option
      await expect(page.locator('[data-testid="recovery-alert"]')).toBeVisible()
      await expect(page.locator('text=Resume Verification')).toBeVisible()
      
      // Should have both continue and start fresh options
      await expect(page.locator('[data-testid="continue-verification-btn"]')).toBeVisible()
      await expect(page.locator('[data-testid="start-fresh-btn"]')).toBeVisible()
    })

    test('should handle recovery from partial verification state', async ({ page }) => {
      // Mock partial verification state
      await page.route('**/api/stripe/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'acct_test_partial',
            charges_enabled: false,
            payouts_enabled: false,
            details_submitted: true,
            requirements: {
              currently_due: ['individual.verification.document'],
              eventually_due: [],
              past_due: [],
              pending_verification: []
            }
          })
        })
      })
      
      await createTestWasher(page)
      
      // Should show status banner for partial verification
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
      await expect(page.locator('text=Action Required')).toBeVisible()
      
      // Should show specific requirements
      await expect(page.locator('text=individual verification document')).toBeVisible()
      
      // Should have continue verification option
      await expect(page.locator('[data-testid="continue-verification-btn"]')).toBeVisible()
    })

    test('should clear recovery state after successful completion', async ({ page }) => {
      await createTestWasher(page)
      
      // Start verification
      await page.click('[data-testid="start-verification-btn"]')
      
      // Simulate successful completion
      await page.route('**/api/stripe/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
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
          })
        })
      })
      
      // Simulate return from Stripe
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should not show recovery alert after completion
      await expect(page.locator('[data-testid="recovery-alert"]')).not.toBeVisible()
      
      // Should show full dashboard
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    })
  })

  test.describe('Error Boundary Handling', () => {
    test('should catch and handle component errors', async ({ page }) => {
      // Mock a component error by causing a JavaScript error
      await page.addInitScript(() => {
        // Override a method to throw an error
        window.addEventListener('error', (event) => {
          if (event.error?.message?.includes('Test error')) {
            // This is our intentional test error
            event.preventDefault()
          }
        })
      })
      
      await createTestWasher(page)
      
      // Trigger an error in the component
      await page.evaluate(() => {
        throw new Error('Test error for error boundary')
      })
      
      // Should show error boundary fallback
      await expect(page.locator('[data-testid="error-boundary-fallback"]')).toBeVisible()
      await expect(page.locator('text=Something went wrong')).toBeVisible()
      
      // Should have retry option
      await expect(page.locator('[data-testid="error-boundary-retry"]')).toBeVisible()
    })

    test('should handle maximum retry attempts', async ({ page }) => {
      let errorCount = 0
      
      await page.route('**/api/stripe/**', async (route) => {
        errorCount++
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        })
      })
      
      await createTestWasher(page)
      
      // Try multiple retries
      for (let i = 0; i < 4; i++) {
        if (await page.locator('[data-testid="retry-btn"]').isVisible()) {
          await page.click('[data-testid="retry-btn"]')
          await page.waitForTimeout(1000)
        }
      }
      
      // Should eventually stop showing retry option
      await expect(page.locator('text=Maximum retry attempts reached')).toBeVisible()
      await expect(page.locator('[data-testid="retry-btn"]')).not.toBeVisible()
      
      // Should suggest contacting support
      await expect(page.locator('text=contact support')).toBeVisible()
    })
  })

  test.describe('User Experience During Errors', () => {
    test('should maintain user context during error recovery', async ({ page }) => {
      await createTestWasher(page)
      
      // Mock error during verification start
      await mockStripeError(page, 'api_error')
      
      // Try to start verification
      await page.click('[data-testid="start-verification-btn"]')
      
      // Should show error
      await expect(page.locator('[data-testid="error-alert"]')).toBeVisible()
      
      // Fix the error
      await page.route('**/api/stripe/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'acct_test_recovery',
            charges_enabled: false,
            payouts_enabled: false,
            details_submitted: false
          })
        })
      })
      
      // Retry should work
      await page.click('[data-testid="retry-btn"]')
      
      // Should proceed with verification
      await expect(page.locator('text=Starting Verification...')).toBeVisible()
    })

    test('should provide helpful error messages', async ({ page }) => {
      await mockStripeError(page, 'invalid_request_error', 'account_invalid')
      await createTestWasher(page)
      
      // Should show user-friendly error message
      await expect(page.locator('text=The account ID is invalid')).toBeVisible()
      
      // Should not show technical error details to user
      await expect(page.locator('text=StripeInvalidRequestError')).not.toBeVisible()
      await expect(page.locator('text=stack trace')).not.toBeVisible()
      
      // Should provide next steps
      await expect(page.locator('text=Please try again')).toBeVisible()
    })

    test('should handle errors gracefully without breaking the UI', async ({ page }) => {
      await mockStripeError(page, 'api_error')
      await createTestWasher(page)
      
      // UI should still be functional despite error
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      // Navigation should still work
      await expect(page.locator('text=Complete Your Washer Verification')).toBeVisible()
      
      // Other UI elements should be accessible
      await expect(page.locator('text=Why do we need verification?')).toBeVisible()
      
      // Error should not prevent user from accessing help
      await expect(page.locator('text=contact our support team')).toBeVisible()
    })
  })
})