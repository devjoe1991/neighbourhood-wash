import { test, expect, Page } from '@playwright/test'

// Test utilities
async function mockAuthenticatedUser(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock-token',
      user: {
        id: 'test-user-id-123',
        email: 'test-washer@example.com',
        role: 'washer'
      }
    }))
  })
}

async function navigateToWasherDashboard(page: Page) {
  await mockAuthenticatedUser(page)
  await page.goto('/washer/dashboard')
  await page.waitForLoadState('networkidle')
}

test.describe('Washer Onboarding Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test.describe('API Error Handling', () => {
    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error for onboarding status
      await page.route('**/api/stripe/onboarding-status', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Internal server error' }
          })
        })
      })

      await navigateToWasherDashboard(page)

      await test.step('Handle Onboarding Status Load Error', async () => {
        // Should show error state
        await expect(page.locator('[data-testid="loading-error"]')).toContainText('Failed to load onboarding status')
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('Connection Error')
        
        // Should show retry option
        await expect(page.locator('[data-testid="retry-load"]')).toBeVisible()
      })

      await test.step('Test Error Recovery', async () => {
        // Mock successful retry
        await page.route('**/api/stripe/onboarding-status', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                currentStep: 1,
                completedSteps: [],
                isComplete: false
              }
            })
          })
        })
        
        // Click retry
        await page.click('[data-testid="retry-load"]')
        
        // Should load successfully
        await expect(page.locator('text=Complete Your Setup')).toBeVisible()
        await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/current/)
      })
    })

    test('should handle authentication errors', async ({ page }) => {
      // Mock authentication error
      await page.route('**/api/stripe/**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Unauthorized' }
          })
        })
      })

      await navigateToWasherDashboard(page)

      await test.step('Handle Auth Error', async () => {
        // Should show authentication error
        await expect(page.locator('[data-testid="auth-error"]')).toContainText('Authentication required')
        
        // Should provide sign-in option
        await expect(page.locator('[data-testid="sign-in-link"]')).toBeVisible()
      })
    })

    test('should handle rate limiting errors', async ({ page }) => {
      // Mock rate limiting error
      await page.route('**/api/stripe/profile-setup', async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Too many requests' }
          }),
          headers: {
            'Retry-After': '60'
          }
        })
      })

      await navigateToWasherDashboard(page)

      // Mock successful initial load
      await page.route('**/api/stripe/onboarding-status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentStep: 1,
              completedSteps: [],
              isComplete: false
            }
          })
        })
      })

      await test.step('Handle Rate Limiting', async () => {
        // Fill profile form
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        
        // Try to submit
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should show rate limiting error
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('Too many requests')
        await expect(page.locator('text=Please wait 60 seconds before trying again')).toBeVisible()
        
        // Retry button should be disabled temporarily
        await expect(page.locator('[data-testid="complete-profile-setup"]')).toBeDisabled()
      })
    })
  })

  test.describe('Stripe Integration Errors', () => {
    test('should handle Stripe account creation failures', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Mock successful initial load and profile setup
      await page.route('**/api/stripe/onboarding-status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentStep: 1,
              completedSteps: [],
              isComplete: false
            }
          })
        })
      })

      await page.route('**/api/stripe/profile-setup', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })

      // Complete Step 1
      await page.fill('[data-testid="service-area"]', 'Central London')
      await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
      await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
      await page.check('[data-testid="availability-Monday Morning"]')
      await page.check('[data-testid="service-type-Wash & Dry"]')
      await page.click('[data-testid="complete-profile-setup"]')

      // Mock Stripe account creation failure
      await page.route('**/api/stripe/initiate-kyc', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { 
              message: 'Unable to create Stripe account',
              code: 'account_creation_failed',
              details: 'Invalid business information provided'
            }
          })
        })
      })

      await test.step('Handle Stripe Account Creation Error', async () => {
        // Try to start KYC
        await page.click('[data-testid="start-kyc"]')
        
        // Should show specific Stripe error
        await expect(page.locator('[data-testid="kyc-error"]')).toContainText('Unable to create Stripe account')
        await expect(page.locator('[data-testid="error-details"]')).toContainText('Invalid business information provided')
        
        // Should show retry and support options
        await expect(page.locator('[data-testid="retry-kyc"]')).toBeVisible()
        await expect(page.locator('[data-testid="contact-support"]')).toBeVisible()
      })
    })

    test('should handle Stripe webhook failures', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Mock successful steps up to payment
      await page.route('**/api/stripe/onboarding-status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentStep: 4,
              completedSteps: [1, 2, 3],
              isComplete: false
            }
          })
        })
      })

      // Mock payment processing success but webhook failure
      await page.route('**/api/stripe/process-payment', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              paymentIntentId: 'pi_test_123456789',
              clientSecret: 'pi_test_123456789_secret_test'
            }
          })
        })
      })

      // Mock webhook processing failure
      await page.route('**/api/stripe/confirm-payment', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { 
              message: 'Webhook processing failed',
              code: 'webhook_error'
            }
          })
        })
      })

      await test.step('Handle Webhook Processing Error', async () => {
        // Process payment
        await page.click('[data-testid="process-payment"]')
        
        // Mock successful payment on client side
        await page.evaluate(() => {
          window.postMessage({ 
            type: 'payment_complete', 
            paymentIntentId: 'pi_test_123456789' 
          }, window.location.origin)
        })
        
        // Should show webhook processing error
        await expect(page.locator('[data-testid="webhook-error"]')).toContainText('Payment processed but verification pending')
        await expect(page.locator('text=Your payment was successful, but we\'re still processing your account')).toBeVisible()
        
        // Should show manual verification option
        await expect(page.locator('[data-testid="manual-verification"]')).toBeVisible()
      })
    })

    test('should handle expired Stripe onboarding links', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Mock successful initial steps
      await page.route('**/api/stripe/onboarding-status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentStep: 2,
              completedSteps: [1],
              isComplete: false,
              stripeAccountId: 'acct_test_123456789'
            }
          })
        })
      })

      // Mock expired link error
      await page.route('**/api/stripe/initiate-kyc', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { 
              message: 'Onboarding link has expired',
              code: 'link_expired'
            }
          })
        })
      })

      await test.step('Handle Expired Link', async () => {
        // Try to continue KYC
        await page.click('[data-testid="start-kyc"]')
        
        // Should show expired link error
        await expect(page.locator('[data-testid="kyc-error"]')).toContainText('Onboarding link has expired')
        
        // Should automatically generate new link
        await expect(page.locator('text=Generating new verification link')).toBeVisible()
        
        // Mock successful new link generation
        await page.route('**/api/stripe/initiate-kyc', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                accountId: 'acct_test_123456789',
                onboardingUrl: 'https://connect.stripe.com/setup/new_test_123'
              }
            })
          })
        })
        
        // Should proceed with new link
        await expect(page.locator('text=Redirecting to Stripe')).toBeVisible()
      })
    })
  })

  test.describe('Data Persistence Errors', () => {
    test('should handle database connection failures', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Mock database connection error
      await page.route('**/api/stripe/profile-setup', async (route) => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { 
              message: 'Database connection failed',
              code: 'db_connection_error'
            }
          })
        })
      })

      await test.step('Handle Database Error', async () => {
        // Fill profile form
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        
        // Try to submit
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should show database error
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('Database connection failed')
        
        // Should preserve form data
        await expect(page.locator('[data-testid="service-area"]')).toHaveValue('Central London')
        await expect(page.locator('[data-testid="phone-number"]')).toHaveValue('+44 7123 456789')
        
        // Should show retry option
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
      })
    })

    test('should handle data corruption scenarios', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Mock corrupted data response
      await page.route('**/api/stripe/onboarding-status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentStep: null, // Corrupted data
              completedSteps: 'invalid', // Wrong type
              isComplete: undefined
            }
          })
        })
      })

      await test.step('Handle Corrupted Data', async () => {
        // Should show data recovery options
        await expect(page.locator('[data-testid="data-corruption-error"]')).toContainText('Data integrity issue detected')
        
        // Should offer to reset onboarding
        await expect(page.locator('[data-testid="reset-onboarding"]')).toBeVisible()
        await expect(page.locator('[data-testid="contact-support"]')).toBeVisible()
      })
    })
  })

  test.describe('Browser Compatibility Issues', () => {
    test('should handle localStorage unavailability', async ({ page }) => {
      // Disable localStorage
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: null,
          writable: false
        })
      })

      await navigateToWasherDashboard(page)

      await test.step('Handle Missing localStorage', async () => {
        // Should show warning about browser compatibility
        await expect(page.locator('[data-testid="browser-compatibility-warning"]')).toContainText('Browser storage unavailable')
        
        // Should still allow onboarding but warn about session persistence
        await expect(page.locator('text=Progress may not be saved between sessions')).toBeVisible()
        
        // Should still be functional
        await expect(page.locator('text=Complete Your Setup')).toBeVisible()
      })
    })

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      // Inject JavaScript error
      await page.addInitScript(() => {
        window.addEventListener('load', () => {
          // Simulate a JavaScript error in onboarding component
          const originalConsoleError = console.error
          console.error = (...args) => {
            if (args[0]?.includes?.('onboarding')) {
              throw new Error('Simulated JavaScript error')
            }
            originalConsoleError(...args)
          }
        })
      })

      await navigateToWasherDashboard(page)

      await test.step('Handle JavaScript Errors', async () => {
        // Should show error boundary
        await expect(page.locator('[data-testid="error-boundary"]')).toContainText('Something went wrong')
        
        // Should offer recovery options
        await expect(page.locator('[data-testid="reload-page"]')).toBeVisible()
        await expect(page.locator('[data-testid="report-error"]')).toBeVisible()
      })
    })
  })

  test.describe('Edge Cases', () => {
    test('should handle concurrent onboarding attempts', async ({ page, context }) => {
      // Create two pages for the same user
      const page1 = page
      const page2 = await context.newPage()

      await mockAuthenticatedUser(page1)
      await mockAuthenticatedUser(page2)

      // Mock API to track concurrent requests
      let requestCount = 0
      const mockConcurrentRequests = async (route: any) => {
        requestCount++
        if (requestCount > 1) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { 
                message: 'Concurrent onboarding detected',
                code: 'concurrent_request'
              }
            })
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        }
      }

      await page1.route('**/api/stripe/profile-setup', mockConcurrentRequests)
      await page2.route('**/api/stripe/profile-setup', mockConcurrentRequests)

      await test.step('Handle Concurrent Requests', async () => {
        // Navigate both pages to dashboard
        await page1.goto('/washer/dashboard')
        await page2.goto('/washer/dashboard')

        // Fill forms on both pages simultaneously
        await Promise.all([
          page1.fill('[data-testid="service-area"]', 'Central London'),
          page2.fill('[data-testid="service-area"]', 'Manchester')
        ])

        await Promise.all([
          page1.fill('[data-testid="phone-number"]', '+44 7123 456789'),
          page2.fill('[data-testid="phone-number"]', '+44 7987 654321')
        ])

        await Promise.all([
          page1.fill('[data-testid="bio"]', 'Bio from page 1'),
          page2.fill('[data-testid="bio"]', 'Bio from page 2')
        ])

        await Promise.all([
          page1.check('[data-testid="availability-Monday Morning"]'),
          page2.check('[data-testid="availability-Tuesday Morning"]')
        ])

        await Promise.all([
          page1.check('[data-testid="service-type-Wash & Dry"]'),
          page2.check('[data-testid="service-type-Ironing"]')
        ])

        // Submit simultaneously
        await Promise.all([
          page1.click('[data-testid="complete-profile-setup"]'),
          page2.click('[data-testid="complete-profile-setup"]')
        ])

        // One should succeed, one should show conflict error
        const page1Success = await page1.locator('[data-testid="step-1"]').getAttribute('class')
        const page2Error = await page2.locator('[data-testid="toast-error"]').textContent()

        expect(page1Success).toContain('completed')
        expect(page2Error).toContain('Concurrent onboarding detected')
      })
    })

    test('should handle extremely slow network conditions', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Mock extremely slow API responses
      await page.route('**/api/stripe/profile-setup', async (route) => {
        // Delay for 30 seconds to simulate very slow network
        await new Promise(resolve => setTimeout(resolve, 30000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })

      await test.step('Handle Slow Network', async () => {
        // Fill profile form
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        
        // Submit form
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should show loading state
        await expect(page.locator('[data-testid="loading-overlay"]')).toBeVisible()
        await expect(page.locator('text=Processing step')).toBeVisible()
        
        // Should show timeout warning after reasonable time
        await expect(page.locator('[data-testid="timeout-warning"]')).toBeVisible({ timeout: 15000 })
        await expect(page.locator('text=This is taking longer than expected')).toBeVisible()
        
        // Should offer cancel option
        await expect(page.locator('[data-testid="cancel-request"]')).toBeVisible()
      })
    })

    test('should handle malformed API responses', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Mock malformed JSON response
      await page.route('**/api/stripe/profile-setup', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response {'
        })
      })

      await test.step('Handle Malformed Response', async () => {
        // Fill and submit form
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should show parsing error
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('Invalid server response')
        
        // Should preserve form data
        await expect(page.locator('[data-testid="service-area"]')).toHaveValue('Central London')
        
        // Should offer retry
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
      })
    })
  })
})