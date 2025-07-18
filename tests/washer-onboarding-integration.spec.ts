import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test data and utilities
const TEST_USER = {
  email: 'test-washer@example.com',
  password: 'TestPassword123!',
  id: 'test-user-id-123'
}

const PROFILE_DATA = {
  serviceArea: 'Central London',
  phoneNumber: '+44 7123 456789',
  bio: 'Experienced laundry professional with 5+ years of experience providing excellent service.',
  availability: ['Monday Morning', 'Tuesday Afternoon', 'Wednesday Evening'],
  serviceTypes: ['Wash & Dry', 'Ironing', 'Collection & Delivery'],
  preferences: 'Eco-friendly detergents preferred'
}

// Mock Stripe responses for testing
const MOCK_STRIPE_RESPONSES = {
  accountId: 'acct_test_123456789',
  onboardingUrl: 'https://connect.stripe.com/setup/test_123',
  paymentIntentId: 'pi_test_123456789',
  clientSecret: 'pi_test_123456789_secret_test'
}

// Helper functions
async function mockStripeAPI(page: Page) {
  // Mock Stripe API calls to avoid external dependencies
  await page.route('**/lib/stripe/actions', async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    
    // Mock successful responses for all Stripe actions
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
}

async function mockAuthenticatedUser(page: Page) {
  // Mock authentication state
  await page.addInitScript(() => {
    // Mock user object
    window.__TEST_USER__ = {
      id: 'test-user-id-123',
      email: 'test-washer@example.com',
      role: 'washer'
    }
  })
}

async function navigateToWasherDashboard(page: Page) {
  await mockAuthenticatedUser(page)
  await mockStripeAPI(page)
  await page.goto('/washer/dashboard')
  await page.waitForLoadState('networkidle')
}

test.describe('Washer 4-Step Onboarding Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set up common test environment
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test.describe('End-to-End Onboarding Journey', () => {
    test('should complete full 4-step onboarding flow successfully', async ({ page }) => {
      // Navigate to washer dashboard
      await navigateToWasherDashboard(page)

      // Verify initial state - dashboard with locked features
      await expect(page.locator('h1')).toContainText('Welcome to Your Washer Dashboard')
      await expect(page.locator('text=Complete Your Setup')).toBeVisible()
      
      // Verify locked features are displayed
      await expect(page.locator('text=Available Bookings')).toBeVisible()
      await expect(page.locator('text=My Bookings')).toBeVisible()
      await expect(page.locator('text=Payouts & Earnings')).toBeVisible()
      await expect(page.locator('[data-testid="locked-feature"]').first()).toBeVisible()

      // Step 1: Profile Setup
      await test.step('Complete Profile Setup (Step 1)', async () => {
        // Verify step 1 is current
        await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/current/)
        
        // Fill profile form
        await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
        await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
        await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
        
        // Select availability options
        for (const availability of PROFILE_DATA.availability) {
          await page.check(`[data-testid="availability-${availability}"]`)
        }
        
        // Select service types
        for (const serviceType of PROFILE_DATA.serviceTypes) {
          await page.check(`[data-testid="service-type-${serviceType}"]`)
        }
        
        await page.fill('[data-testid="preferences"]', PROFILE_DATA.preferences)
        
        // Submit profile setup
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Wait for step completion
        await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/completed/)
        await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/current/)
        
        // Verify success toast
        await expect(page.locator('[data-testid="toast-success"]')).toContainText('Profile setup completed')
      })

      // Step 2: Stripe KYC
      await test.step('Complete Stripe KYC (Step 2)', async () => {
        // Verify KYC step is current
        await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/current/)
        await expect(page.locator('text=Stripe Connect KYC')).toBeVisible()
        
        // Start KYC process
        await page.click('[data-testid="start-kyc"]')
        
        // Verify redirect preparation
        await expect(page.locator('text=Redirecting to Stripe')).toBeVisible()
        
        // Mock successful KYC completion callback
        await page.evaluate(() => {
          window.postMessage({ type: 'stripe_kyc_complete' }, window.location.origin)
        })
        
        // Wait for step completion
        await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/completed/)
        await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/current/)
        
        // Verify success message
        await expect(page.locator('text=KYC Verification Complete')).toBeVisible()
      })

      // Step 3: Bank Connection
      await test.step('Complete Bank Connection (Step 3)', async () => {
        // Verify bank connection step is current
        await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/current/)
        await expect(page.locator('text=Bank Account Connection')).toBeVisible()
        
        // Start bank connection
        await page.click('[data-testid="connect-bank"]')
        
        // Mock successful bank connection
        await page.evaluate(() => {
          window.postMessage({ type: 'bank_connection_complete' }, window.location.origin)
        })
        
        // Wait for step completion
        await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/completed/)
        await expect(page.locator('[data-testid="step-4"]')).toHaveClass(/current/)
        
        // Verify success message
        await expect(page.locator('text=Bank account connected successfully')).toBeVisible()
      })

      // Step 4: Payment
      await test.step('Complete Onboarding Payment (Step 4)', async () => {
        // Verify payment step is current
        await expect(page.locator('[data-testid="step-4"]')).toHaveClass(/current/)
        await expect(page.locator('text=Onboarding Fee Payment')).toBeVisible()
        await expect(page.locator('text=£15')).toBeVisible()
        
        // Process payment
        await page.click('[data-testid="process-payment"]')
        
        // Mock successful payment
        await page.evaluate(() => {
          window.postMessage({ 
            type: 'payment_complete', 
            paymentIntentId: 'pi_test_123456789' 
          }, window.location.origin)
        })
        
        // Wait for onboarding completion
        await expect(page.locator('[data-testid="step-4"]')).toHaveClass(/completed/)
        await expect(page.locator('text=Onboarding Complete!')).toBeVisible()
        
        // Verify completion message
        await expect(page.locator('text=You now have full access to all washer features')).toBeVisible()
      })

      // Verify dashboard unlocking
      await test.step('Verify Dashboard Features Unlocked', async () => {
        // Click to access full dashboard
        await page.click('[data-testid="access-full-dashboard"]')
        
        // Wait for page reload/update
        await page.waitForLoadState('networkidle')
        
        // Verify features are now unlocked
        await expect(page.locator('[data-testid="available-bookings-unlocked"]')).toBeVisible()
        await expect(page.locator('[data-testid="my-bookings-unlocked"]')).toBeVisible()
        await expect(page.locator('[data-testid="payouts-unlocked"]')).toBeVisible()
        
        // Verify onboarding container is no longer displayed
        await expect(page.locator('text=Complete Your Setup')).not.toBeVisible()
      })
    })

    test('should handle step-by-step progress updates correctly', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Test progress indicator updates
      await test.step('Verify Initial Progress State', async () => {
        // Check progress bar shows 0%
        await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('value', '0')
        await expect(page.locator('text=0% Complete')).toBeVisible()
        
        // Check step indicators
        await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/current/)
        await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/pending/)
        await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/pending/)
        await expect(page.locator('[data-testid="step-4"]')).toHaveClass(/pending/)
      })

      // Complete Step 1 and verify progress
      await test.step('Verify Progress After Step 1', async () => {
        // Fill and submit profile
        await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
        await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
        await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Check progress updates
        await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('value', '25')
        await expect(page.locator('text=25% Complete')).toBeVisible()
        
        // Check step states
        await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/completed/)
        await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/current/)
        await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/pending/)
        await expect(page.locator('[data-testid="step-4"]')).toHaveClass(/pending/)
      })

      // Complete Step 2 and verify progress
      await test.step('Verify Progress After Step 2', async () => {
        await page.click('[data-testid="start-kyc"]')
        await page.evaluate(() => {
          window.postMessage({ type: 'stripe_kyc_complete' }, window.location.origin)
        })
        
        // Check progress updates
        await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('value', '50')
        await expect(page.locator('text=50% Complete')).toBeVisible()
        
        // Check step states
        await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/completed/)
        await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/completed/)
        await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/current/)
        await expect(page.locator('[data-testid="step-4"]')).toHaveClass(/pending/)
      })
    })

    test('should allow navigation between completed steps', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Complete first two steps
      await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
      await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
      await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
      await page.check('[data-testid="availability-Monday Morning"]')
      await page.check('[data-testid="service-type-Wash & Dry"]')
      await page.click('[data-testid="complete-profile-setup"]')
      
      await page.click('[data-testid="start-kyc"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'stripe_kyc_complete' }, window.location.origin)
      })

      // Test back navigation
      await test.step('Test Back Navigation', async () => {
        // Should be on step 3 now
        await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/current/)
        
        // Click back button
        await page.click('[data-testid="back-button"]')
        
        // Should go back to step 2
        await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/current/)
        await expect(page.locator('text=KYC Verification Complete')).toBeVisible()
        
        // Can navigate forward again
        await page.click('[data-testid="continue-button"]')
        await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/current/)
      })
    })
  })

  test.describe('Feature Access Control', () => {
    test('should prevent access to washer features before onboarding completion', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Test locked feature states
      await test.step('Verify Features Are Locked', async () => {
        // Check that booking features are disabled
        const availableBookingsCard = page.locator('[data-testid="available-bookings-card"]')
        await expect(availableBookingsCard).toHaveClass(/locked/)
        await expect(availableBookingsCard.locator('button')).toBeDisabled()
        
        const myBookingsCard = page.locator('[data-testid="my-bookings-card"]')
        await expect(myBookingsCard).toHaveClass(/locked/)
        await expect(myBookingsCard.locator('button')).toBeDisabled()
        
        const payoutsCard = page.locator('[data-testid="payouts-card"]')
        await expect(payoutsCard).toHaveClass(/locked/)
        await expect(payoutsCard.locator('button')).toBeDisabled()
        
        // Verify locked indicators
        await expect(page.locator('text=Locked')).toHaveCount(3)
        await expect(page.locator('text=Complete Setup to Unlock')).toHaveCount(3)
      })

      // Test direct navigation protection
      await test.step('Verify Direct Navigation Protection', async () => {
        // Try to navigate directly to booking pages
        await page.goto('/washer/dashboard/available-bookings')
        
        // Should be redirected back to dashboard with onboarding
        await expect(page.url()).toContain('/washer/dashboard')
        await expect(page.locator('text=Complete Your Setup')).toBeVisible()
        
        // Try to navigate to payouts
        await page.goto('/washer/dashboard/payouts')
        
        // Should be redirected back to dashboard with onboarding
        await expect(page.url()).toContain('/washer/dashboard')
        await expect(page.locator('text=Complete Your Setup')).toBeVisible()
      })
    })

    test('should unlock features progressively as steps are completed', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Complete profile setup (Step 1)
      await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
      await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
      await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
      await page.check('[data-testid="availability-Monday Morning"]')
      await page.check('[data-testid="service-type-Wash & Dry"]')
      await page.click('[data-testid="complete-profile-setup"]')

      // Verify partial unlock - settings should be available
      await test.step('Verify Settings Available After Profile Setup', async () => {
        const settingsCard = page.locator('[data-testid="settings-card"]')
        await expect(settingsCard).toHaveClass(/available/)
        await expect(settingsCard.locator('button')).not.toBeDisabled()
        await expect(settingsCard.locator('text=Available')).toBeVisible()
      })

      // Complete all steps
      await page.click('[data-testid="start-kyc"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'stripe_kyc_complete' }, window.location.origin)
      })
      
      await page.click('[data-testid="connect-bank"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'bank_connection_complete' }, window.location.origin)
      })
      
      await page.click('[data-testid="process-payment"]')
      await page.evaluate(() => {
        window.postMessage({ 
          type: 'payment_complete', 
          paymentIntentId: 'pi_test_123456789' 
        }, window.location.origin)
      })

      // Verify full unlock
      await test.step('Verify All Features Unlocked After Completion', async () => {
        await page.click('[data-testid="access-full-dashboard"]')
        await page.waitForLoadState('networkidle')
        
        // All features should be unlocked
        await expect(page.locator('[data-testid="available-bookings-unlocked"]')).toBeVisible()
        await expect(page.locator('[data-testid="my-bookings-unlocked"]')).toBeVisible()
        await expect(page.locator('[data-testid="payouts-unlocked"]')).toBeVisible()
        
        // Should be able to navigate to feature pages
        await page.click('[data-testid="available-bookings-link"]')
        await expect(page.url()).toContain('/available-bookings')
      })
    })
  })

  test.describe('Error Scenarios and Recovery', () => {
    test('should handle profile setup validation errors', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Test Required Field Validation', async () => {
        // Try to submit without required fields
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should show validation errors
        await expect(page.locator('[data-testid="error-service-area"]')).toContainText('Service area is required')
        await expect(page.locator('[data-testid="error-phone-number"]')).toContainText('Phone number is required')
        await expect(page.locator('[data-testid="error-bio"]')).toContainText('Bio is required')
        await expect(page.locator('[data-testid="error-availability"]')).toContainText('Please select at least one availability')
        await expect(page.locator('[data-testid="error-service-types"]')).toContainText('Please select at least one service type')
        
        // Should show error toast
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('Form Validation Error')
      })

      await test.step('Test Phone Number Format Validation', async () => {
        await page.fill('[data-testid="phone-number"]', 'invalid-phone')
        await page.click('[data-testid="complete-profile-setup"]')
        
        await expect(page.locator('[data-testid="error-phone-number"]')).toContainText('Please enter a valid phone number')
      })

      await test.step('Test Bio Length Validation', async () => {
        await page.fill('[data-testid="bio"]', 'Too short')
        await page.click('[data-testid="complete-profile-setup"]')
        
        await expect(page.locator('[data-testid="error-bio"]')).toContainText('Bio must be at least 20 characters')
      })
    })

    test('should handle Stripe KYC failures and retries', async ({ page }) => {
      // Mock KYC failure
      await page.route('**/api/stripe/initiate-kyc', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Failed to create Stripe account' }
          })
        })
      })

      await navigateToWasherDashboard(page)

      // Complete Step 1 first
      await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
      await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
      await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
      await page.check('[data-testid="availability-Monday Morning"]')
      await page.check('[data-testid="service-type-Wash & Dry"]')
      await page.click('[data-testid="complete-profile-setup"]')

      await test.step('Test KYC Failure Handling', async () => {
        // Try to start KYC
        await page.click('[data-testid="start-kyc"]')
        
        // Should show error state
        await expect(page.locator('[data-testid="kyc-error"]')).toContainText('Failed to create Stripe account')
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('Failed to complete identity verification')
        
        // Should show retry button
        await expect(page.locator('[data-testid="retry-kyc"]')).toBeVisible()
      })

      await test.step('Test KYC Retry Functionality', async () => {
        // Mock successful retry
        await page.route('**/api/stripe/initiate-kyc', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                accountId: MOCK_STRIPE_RESPONSES.accountId,
                onboardingUrl: MOCK_STRIPE_RESPONSES.onboardingUrl
              }
            })
          })
        })
        
        // Click retry
        await page.click('[data-testid="retry-kyc"]')
        
        // Should proceed successfully
        await expect(page.locator('text=Redirecting to Stripe')).toBeVisible()
      })
    })

    test('should handle payment processing failures', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Complete first 3 steps
      await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
      await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
      await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
      await page.check('[data-testid="availability-Monday Morning"]')
      await page.check('[data-testid="service-type-Wash & Dry"]')
      await page.click('[data-testid="complete-profile-setup"]')
      
      await page.click('[data-testid="start-kyc"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'stripe_kyc_complete' }, window.location.origin)
      })
      
      await page.click('[data-testid="connect-bank"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'bank_connection_complete' }, window.location.origin)
      })

      // Mock payment failure
      await page.route('**/api/stripe/process-payment', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Payment processing failed' }
          })
        })
      })

      await test.step('Test Payment Failure Handling', async () => {
        // Try to process payment
        await page.click('[data-testid="process-payment"]')
        
        // Should show error state
        await expect(page.locator('[data-testid="payment-error"]')).toContainText('Payment processing failed')
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('Failed to process payment')
        
        // Should show retry button
        await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible()
      })
    })

    test('should handle network interruptions and recovery', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Simulate network failure during profile setup
      await page.route('**/api/stripe/profile-setup', async (route) => {
        await route.abort('failed')
      })

      await test.step('Test Network Failure Recovery', async () => {
        // Fill profile form
        await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
        await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
        await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        
        // Try to submit
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should show network error
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('Connection Error')
        
        // Restore network and retry
        await page.route('**/api/stripe/profile-setup', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        })
        
        // Should have retry option
        await page.click('[data-testid="retry-button"]')
        
        // Should succeed on retry
        await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/completed/)
      })
    })

    test('should preserve progress across browser sessions', async ({ page, context }) => {
      await navigateToWasherDashboard(page)

      // Complete Step 1
      await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
      await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
      await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
      await page.check('[data-testid="availability-Monday Morning"]')
      await page.check('[data-testid="service-type-Wash & Dry"]')
      await page.click('[data-testid="complete-profile-setup"]')

      // Simulate browser restart by creating new page
      const newPage = await context.newPage()
      await mockAuthenticatedUser(newPage)
      await mockStripeAPI(newPage)
      
      // Mock returning progress state
      await newPage.route('**/api/stripe/onboarding-status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentStep: 2,
              completedSteps: [1],
              isComplete: false,
              profileData: PROFILE_DATA
            }
          })
        })
      })

      await test.step('Verify Progress Persistence', async () => {
        await newPage.goto('/washer/dashboard')
        await newPage.waitForLoadState('networkidle')
        
        // Should resume from Step 2
        await expect(newPage.locator('[data-testid="step-1"]')).toHaveClass(/completed/)
        await expect(newPage.locator('[data-testid="step-2"]')).toHaveClass(/current/)
        await expect(newPage.locator('text=25% Complete')).toBeVisible()
        
        // Should show recovery prompt
        await expect(newPage.locator('[data-testid="recovery-prompt"]')).toContainText('Continue from step 2')
      })
    })
  })

  test.describe('Payment Processing and Dashboard Unlocking', () => {
    test('should process onboarding fee payment correctly', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Complete first 3 steps quickly
      await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
      await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
      await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
      await page.check('[data-testid="availability-Monday Morning"]')
      await page.check('[data-testid="service-type-Wash & Dry"]')
      await page.click('[data-testid="complete-profile-setup"]')
      
      await page.click('[data-testid="start-kyc"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'stripe_kyc_complete' }, window.location.origin)
      })
      
      await page.click('[data-testid="connect-bank"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'bank_connection_complete' }, window.location.origin)
      })

      await test.step('Verify Payment Step Display', async () => {
        // Should show payment step
        await expect(page.locator('[data-testid="step-4"]')).toHaveClass(/current/)
        await expect(page.locator('text=Onboarding Fee Payment')).toBeVisible()
        await expect(page.locator('text=£15')).toBeVisible()
        
        // Should show payment description
        await expect(page.locator('text=One-time setup fee to unlock all features')).toBeVisible()
      })

      await test.step('Process Payment Successfully', async () => {
        // Click process payment
        await page.click('[data-testid="process-payment"]')
        
        // Should show processing state
        await expect(page.locator('text=Processing payment')).toBeVisible()
        
        // Mock successful payment
        await page.evaluate(() => {
          window.postMessage({ 
            type: 'payment_complete', 
            paymentIntentId: 'pi_test_123456789' 
          }, window.location.origin)
        })
        
        // Should complete onboarding
        await expect(page.locator('text=Onboarding Complete!')).toBeVisible()
        await expect(page.locator('text=Payment successful')).toBeVisible()
      })
    })

    test('should unlock dashboard features immediately after payment', async ({ page }) => {
      // Mock completed onboarding state
      await page.route('**/api/stripe/onboarding-status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentStep: 4,
              completedSteps: [1, 2, 3, 4],
              isComplete: true
            }
          })
        })
      })

      await navigateToWasherDashboard(page)

      await test.step('Verify Immediate Feature Unlock', async () => {
        // Should show completion state
        await expect(page.locator('text=Onboarding Complete!')).toBeVisible()
        
        // Click to access full dashboard
        await page.click('[data-testid="access-full-dashboard"]')
        await page.waitForLoadState('networkidle')
        
        // All features should be immediately available
        await expect(page.locator('[data-testid="available-bookings-unlocked"]')).toBeVisible()
        await expect(page.locator('[data-testid="my-bookings-unlocked"]')).toBeVisible()
        await expect(page.locator('[data-testid="payouts-unlocked"]')).toBeVisible()
        
        // Should be able to click on feature links
        const availableBookingsLink = page.locator('[data-testid="available-bookings-link"]')
        await expect(availableBookingsLink).not.toBeDisabled()
        
        const payoutsLink = page.locator('[data-testid="payouts-link"]')
        await expect(payoutsLink).not.toBeDisabled()
      })

      await test.step('Verify Navigation to Unlocked Features', async () => {
        // Test navigation to available bookings
        await page.click('[data-testid="available-bookings-link"]')
        await expect(page.url()).toContain('/available-bookings')
        
        // Navigate back and test payouts
        await page.goBack()
        await page.click('[data-testid="payouts-link"]')
        await expect(page.url()).toContain('/payouts')
      })
    })

    test('should handle partial payment scenarios', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Complete first 3 steps
      await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
      await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
      await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
      await page.check('[data-testid="availability-Monday Morning"]')
      await page.check('[data-testid="service-type-Wash & Dry"]')
      await page.click('[data-testid="complete-profile-setup"]')
      
      await page.click('[data-testid="start-kyc"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'stripe_kyc_complete' }, window.location.origin)
      })
      
      await page.click('[data-testid="connect-bank"]')
      await page.evaluate(() => {
        window.postMessage({ type: 'bank_connection_complete' }, window.location.origin)
      })

      // Mock payment requires action
      await page.route('**/api/stripe/process-payment', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              paymentIntentId: MOCK_STRIPE_RESPONSES.paymentIntentId,
              clientSecret: MOCK_STRIPE_RESPONSES.clientSecret,
              requiresAction: true
            }
          })
        })
      })

      await test.step('Handle Payment Requiring Additional Action', async () => {
        await page.click('[data-testid="process-payment"]')
        
        // Should show additional action required
        await expect(page.locator('text=Additional verification required')).toBeVisible()
        await expect(page.locator('[data-testid="complete-payment-action"]')).toBeVisible()
        
        // Complete additional action
        await page.click('[data-testid="complete-payment-action"]')
        
        // Mock successful completion
        await page.evaluate(() => {
          window.postMessage({ 
            type: 'payment_complete', 
            paymentIntentId: 'pi_test_123456789' 
          }, window.location.origin)
        })
        
        await expect(page.locator('text=Onboarding Complete!')).toBeVisible()
      })
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await navigateToWasherDashboard(page)

      await test.step('Verify Mobile Layout', async () => {
        // Check that onboarding container is responsive
        await expect(page.locator('[data-testid="onboarding-container"]')).toBeVisible()
        
        // Progress indicator should be compact on mobile
        await expect(page.locator('[data-testid="progress-indicator"]')).toHaveClass(/mobile-compact/)
        
        // Step content should be scrollable
        await expect(page.locator('[data-testid="step-content"]')).toHaveClass(/mobile-scrollable/)
      })

      await test.step('Test Mobile Form Interaction', async () => {
        // Fill form on mobile
        await page.fill('[data-testid="service-area"]', PROFILE_DATA.serviceArea)
        await page.fill('[data-testid="phone-number"]', PROFILE_DATA.phoneNumber)
        await page.fill('[data-testid="bio"]', PROFILE_DATA.bio)
        
        // Mobile checkboxes should be touch-friendly
        await page.tap('[data-testid="availability-Monday Morning"]')
        await page.tap('[data-testid="service-type-Wash & Dry"]')
        
        // Submit button should be full-width on mobile
        const submitButton = page.locator('[data-testid="complete-profile-setup"]')
        await expect(submitButton).toHaveClass(/w-full/)
        
        await submitButton.tap()
        await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/completed/)
      })
    })
  })
})