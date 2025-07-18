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

async function mockStripeAPI(page: Page) {
  await page.route('**/api/stripe/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    
    if (url.includes('onboarding-status') && method === 'GET') {
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
    } else if (url.includes('profile-setup') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    } else {
      await route.continue()
    }
  })
}

async function navigateToWasherDashboard(page: Page) {
  await mockAuthenticatedUser(page)
  await mockStripeAPI(page)
  await page.goto('/washer/dashboard')
  await page.waitForLoadState('networkidle')
}

test.describe('Washer Onboarding UI Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test.describe('Step Transitions and Animations', () => {
    test('should show smooth transitions between steps', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Verify Initial Step Animation', async () => {
        // Check initial step is visible with proper animation classes
        const step1Content = page.locator('[data-testid="step-1-content"]')
        await expect(step1Content).toHaveClass(/opacity-100/)
        await expect(step1Content).toHaveClass(/translate-x-0/)
        
        // Progress indicator should be animated
        const progressBar = page.locator('[data-testid="progress-bar"]')
        await expect(progressBar).toHaveClass(/transition-all/)
      })

      await test.step('Test Step 1 to Step 2 Transition', async () => {
        // Fill Step 1 form
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        
        // Submit and watch transition
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should show transitioning state
        const step1Content = page.locator('[data-testid="step-1-content"]')
        await expect(step1Content).toHaveClass(/opacity-0/, { timeout: 1000 })
        await expect(step1Content).toHaveClass(/translate-x-2/)
        
        // Step 2 should fade in
        const step2Content = page.locator('[data-testid="step-2-content"]')
        await expect(step2Content).toHaveClass(/opacity-100/, { timeout: 2000 })
        await expect(step2Content).toHaveClass(/translate-x-0/)
        
        // Progress bar should animate to 25%
        await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('value', '25')
      })

      await test.step('Test Back Navigation Animation', async () => {
        // Click back button
        await page.click('[data-testid="back-button"]')
        
        // Should animate back to Step 1
        const step2Content = page.locator('[data-testid="step-2-content"]')
        await expect(step2Content).toHaveClass(/opacity-0/, { timeout: 1000 })
        
        const step1Content = page.locator('[data-testid="step-1-content"]')
        await expect(step1Content).toHaveClass(/opacity-100/, { timeout: 2000 })
        
        // Progress should animate back
        await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('value', '0')
      })
    })

    test('should show loading states during step processing', async ({ page }) => {
      await navigateToWasherDashboard(page)

      // Mock slow API response
      await page.route('**/api/stripe/profile-setup', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })

      await test.step('Test Loading State Animation', async () => {
        // Fill form
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        
        // Submit form
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should show loading overlay
        await expect(page.locator('[data-testid="loading-overlay"]')).toBeVisible()
        await expect(page.locator('text=Processing step')).toBeVisible()
        
        // Button should show loading state
        const submitButton = page.locator('[data-testid="complete-profile-setup"]')
        await expect(submitButton).toContainText('Saving Profile')
        await expect(submitButton.locator('[data-testid="loading-spinner"]')).toBeVisible()
        await expect(submitButton).toBeDisabled()
        
        // Loading overlay should have proper styling
        const loadingOverlay = page.locator('[data-testid="loading-overlay"]')
        await expect(loadingOverlay).toHaveClass(/backdrop-blur/)
        await expect(loadingOverlay).toHaveClass(/bg-white\/80/)
      })
    })

    test('should animate step completion indicators', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Test Step Completion Animation', async () => {
        // Initially step 1 should be current
        const step1Indicator = page.locator('[data-testid="step-1-indicator"]')
        await expect(step1Indicator).toHaveClass(/bg-blue-500/)
        await expect(step1Indicator).toHaveClass(/ring-2/)
        await expect(step1Indicator).toHaveClass(/ring-blue-200/)
        
        // Complete Step 1
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Step 1 indicator should animate to completed state
        await expect(step1Indicator).toHaveClass(/bg-green-500/, { timeout: 2000 })
        await expect(step1Indicator.locator('[data-testid="check-icon"]')).toBeVisible()
        
        // Step 2 should become current with animation
        const step2Indicator = page.locator('[data-testid="step-2-indicator"]')
        await expect(step2Indicator).toHaveClass(/bg-blue-500/)
        await expect(step2Indicator).toHaveClass(/ring-2/)
        
        // Progress line should animate
        const progressLine = page.locator('[data-testid="progress-line-1"]')
        await expect(progressLine).toHaveClass(/bg-green-500/)
      })
    })
  })

  test.describe('Visual State Changes', () => {
    test('should update dashboard feature states correctly', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Verify Initial Locked State', async () => {
        // All main features should be locked
        const lockedFeatures = [
          '[data-testid="available-bookings-card"]',
          '[data-testid="my-bookings-card"]',
          '[data-testid="payouts-card"]'
        ]

        for (const selector of lockedFeatures) {
          const card = page.locator(selector)
          await expect(card).toHaveClass(/border-dashed/)
          await expect(card).toHaveClass(/border-gray-300/)
          await expect(card).toHaveClass(/bg-gray-50/)
          
          // Should have locked badge
          await expect(card.locator('[data-testid="locked-badge"]')).toContainText('Locked')
          
          // Button should be disabled
          await expect(card.locator('button')).toBeDisabled()
          await expect(card.locator('button')).toHaveClass(/cursor-not-allowed/)
        }
        
        // Settings should be available
        const settingsCard = page.locator('[data-testid="settings-card"]')
        await expect(settingsCard).toHaveClass(/border-green-200/)
        await expect(settingsCard).toHaveClass(/bg-green-50/)
        await expect(settingsCard.locator('[data-testid="available-badge"]')).toContainText('Available')
      })

      await test.step('Test Progressive Feature Unlocking', async () => {
        // Complete onboarding steps
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        await page.click('[data-testid="complete-profile-setup"]')

        // Mock remaining steps completion
        await page.evaluate(() => {
          window.postMessage({ type: 'stripe_kyc_complete' }, window.location.origin)
        })
        
        await page.evaluate(() => {
          window.postMessage({ type: 'bank_connection_complete' }, window.location.origin)
        })
        
        await page.evaluate(() => {
          window.postMessage({ 
            type: 'payment_complete', 
            paymentIntentId: 'pi_test_123456789' 
          }, window.location.origin)
        })

        // Click to access full dashboard
        await page.click('[data-testid="access-full-dashboard"]')
        await page.waitForLoadState('networkidle')

        // Features should now be unlocked with different styling
        const unlockedFeatures = [
          '[data-testid="available-bookings-unlocked"]',
          '[data-testid="my-bookings-unlocked"]',
          '[data-testid="payouts-unlocked"]'
        ]

        for (const selector of unlockedFeatures) {
          const card = page.locator(selector)
          await expect(card).toHaveClass(/border-solid/)
          await expect(card).not.toHaveClass(/border-dashed/)
          await expect(card).not.toHaveClass(/bg-gray-50/)
          
          // Should have unlocked badge or no badge
          await expect(card.locator('[data-testid="locked-badge"]')).not.toBeVisible()
          
          // Button should be enabled
          await expect(card.locator('button')).not.toBeDisabled()
          await expect(card.locator('button')).not.toHaveClass(/cursor-not-allowed/)
        }
      })
    })

    test('should show appropriate success and error states', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Test Success State Styling', async () => {
        // Complete Step 1
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        await page.click('[data-testid="complete-profile-setup"]')

        // Should show success toast with proper styling
        const successToast = page.locator('[data-testid="toast-success"]')
        await expect(successToast).toBeVisible()
        await expect(successToast).toHaveClass(/bg-green-50/)
        await expect(successToast).toHaveClass(/border-green-200/)
        await expect(successToast.locator('[data-testid="success-icon"]')).toBeVisible()
        
        // Step completion should show success styling
        const completedStep = page.locator('[data-testid="step-1"]')
        await expect(completedStep).toHaveClass(/completed/)
        await expect(completedStep.locator('[data-testid="check-circle"]')).toBeVisible()
      })

      await test.step('Test Error State Styling', async () => {
        // Mock API error for next step
        await page.route('**/api/stripe/initiate-kyc', async (route) => {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: 'KYC initiation failed' }
            })
          })
        })

        // Try to start KYC
        await page.click('[data-testid="start-kyc"]')

        // Should show error state with proper styling
        const errorState = page.locator('[data-testid="kyc-error"]')
        await expect(errorState).toBeVisible()
        await expect(errorState).toHaveClass(/bg-red-50/)
        await expect(errorState).toHaveClass(/border-red-200/)
        await expect(errorState.locator('[data-testid="error-icon"]')).toBeVisible()
        
        // Error toast should have proper styling
        const errorToast = page.locator('[data-testid="toast-error"]')
        await expect(errorToast).toBeVisible()
        await expect(errorToast).toHaveClass(/bg-red-50/)
        await expect(errorToast).toHaveClass(/border-red-200/)
      })
    })

    test('should handle responsive design changes', async ({ page }) => {
      await test.step('Test Desktop Layout', async () => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await navigateToWasherDashboard(page)

        // Desktop should show horizontal step indicator
        const stepIndicator = page.locator('[data-testid="step-indicator"]')
        await expect(stepIndicator).toHaveClass(/flex-row/)
        
        // Progress should be horizontal
        const progressContainer = page.locator('[data-testid="progress-container"]')
        await expect(progressContainer).toHaveClass(/flex-row/)
        
        // Cards should be in grid layout
        const dashboardGrid = page.locator('[data-testid="dashboard-grid"]')
        await expect(dashboardGrid).toHaveClass(/grid-cols-3/)
      })

      await test.step('Test Tablet Layout', async () => {
        await page.setViewportSize({ width: 768, height: 1024 })
        
        // Should adapt to tablet layout
        const dashboardGrid = page.locator('[data-testid="dashboard-grid"]')
        await expect(dashboardGrid).toHaveClass(/md:grid-cols-2/)
        
        // Step indicator should remain horizontal but more compact
        const stepIndicator = page.locator('[data-testid="step-indicator"]')
        await expect(stepIndicator).toHaveClass(/space-x-2/)
      })

      await test.step('Test Mobile Layout', async () => {
        await page.setViewportSize({ width: 375, height: 667 })
        
        // Should stack cards vertically
        const dashboardGrid = page.locator('[data-testid="dashboard-grid"]')
        await expect(dashboardGrid).toHaveClass(/grid-cols-1/)
        
        // Step indicator should be more compact
        const stepIndicator = page.locator('[data-testid="step-indicator"]')
        await expect(stepIndicator).toHaveClass(/space-x-1/)
        
        // Progress text should be smaller
        const progressText = page.locator('[data-testid="progress-text"]')
        await expect(progressText).toHaveClass(/text-sm/)
      })
    })
  })

  test.describe('Interactive Elements', () => {
    test('should handle hover states correctly', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Test Button Hover States', async () => {
        const submitButton = page.locator('[data-testid="complete-profile-setup"]')
        
        // Hover should change appearance
        await submitButton.hover()
        await expect(submitButton).toHaveClass(/hover:bg-blue-700/)
        
        // Disabled button should not have hover effect
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        await page.click('[data-testid="complete-profile-setup"]')
        
        // During loading, hover should not work
        await expect(submitButton).toBeDisabled()
        await submitButton.hover()
        await expect(submitButton).toHaveClass(/cursor-not-allowed/)
      })

      await test.step('Test Card Hover States', async () => {
        // Locked cards should not have hover effects
        const lockedCard = page.locator('[data-testid="available-bookings-card"]')
        await lockedCard.hover()
        await expect(lockedCard).not.toHaveClass(/hover:shadow-lg/)
        
        // Available cards should have hover effects
        const availableCard = page.locator('[data-testid="settings-card"]')
        await availableCard.hover()
        await expect(availableCard).toHaveClass(/hover:shadow-lg/)
      })
    })

    test('should handle focus states for accessibility', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Test Keyboard Navigation', async () => {
        // Tab through form elements
        await page.keyboard.press('Tab')
        await expect(page.locator('[data-testid="service-area"]')).toBeFocused()
        
        await page.keyboard.press('Tab')
        await expect(page.locator('[data-testid="phone-number"]')).toBeFocused()
        
        await page.keyboard.press('Tab')
        await expect(page.locator('[data-testid="bio"]')).toBeFocused()
        
        // Focus should be visible
        const focusedElement = page.locator(':focus')
        await expect(focusedElement).toHaveClass(/focus:ring-2/)
        await expect(focusedElement).toHaveClass(/focus:ring-blue-500/)
      })

      await test.step('Test Skip Links', async () => {
        // Should have skip to content link
        await page.keyboard.press('Tab')
        const skipLink = page.locator('[data-testid="skip-to-content"]')
        if (await skipLink.isVisible()) {
          await expect(skipLink).toBeFocused()
          await expect(skipLink).toContainText('Skip to main content')
        }
      })
    })

    test('should provide proper ARIA labels and roles', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Test ARIA Labels', async () => {
        // Progress bar should have proper ARIA attributes
        const progressBar = page.locator('[data-testid="progress-bar"]')
        await expect(progressBar).toHaveAttribute('role', 'progressbar')
        await expect(progressBar).toHaveAttribute('aria-valuenow', '0')
        await expect(progressBar).toHaveAttribute('aria-valuemin', '0')
        await expect(progressBar).toHaveAttribute('aria-valuemax', '100')
        await expect(progressBar).toHaveAttribute('aria-label', /onboarding progress/i)
        
        // Step indicators should have proper labels
        const step1 = page.locator('[data-testid="step-1-indicator"]')
        await expect(step1).toHaveAttribute('aria-label', /step 1.*profile setup/i)
        
        // Form fields should have proper labels
        const serviceArea = page.locator('[data-testid="service-area"]')
        await expect(serviceArea).toHaveAttribute('aria-label', /service area/i)
        
        // Required fields should be marked
        await expect(serviceArea).toHaveAttribute('aria-required', 'true')
      })

      await test.step('Test Live Regions', async () => {
        // Status updates should be announced
        const statusRegion = page.locator('[data-testid="status-live-region"]')
        await expect(statusRegion).toHaveAttribute('aria-live', 'polite')
        
        // Error messages should be announced immediately
        const errorRegion = page.locator('[data-testid="error-live-region"]')
        await expect(errorRegion).toHaveAttribute('aria-live', 'assertive')
      })
    })
  })

  test.describe('Performance and Optimization', () => {
    test('should load step content efficiently', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Test Lazy Loading', async () => {
        // Only current step content should be in DOM initially
        await expect(page.locator('[data-testid="step-1-content"]')).toBeVisible()
        await expect(page.locator('[data-testid="step-2-content"]')).not.toBeVisible()
        await expect(page.locator('[data-testid="step-3-content"]')).not.toBeVisible()
        await expect(page.locator('[data-testid="step-4-content"]')).not.toBeVisible()
      })

      await test.step('Test Content Preloading', async () => {
        // Complete Step 1
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        await page.click('[data-testid="complete-profile-setup"]')

        // Step 2 content should now be loaded
        await expect(page.locator('[data-testid="step-2-content"]')).toBeVisible()
        
        // Step 3 might be preloaded but not visible
        const step3Content = page.locator('[data-testid="step-3-content"]')
        if (await step3Content.count() > 0) {
          await expect(step3Content).not.toBeVisible()
        }
      })
    })

    test('should handle image and asset loading', async ({ page }) => {
      await navigateToWasherDashboard(page)

      await test.step('Test Icon Loading', async () => {
        // Step icons should load quickly
        const stepIcons = page.locator('[data-testid*="step-"][data-testid*="-icon"]')
        const iconCount = await stepIcons.count()
        
        for (let i = 0; i < iconCount; i++) {
          const icon = stepIcons.nth(i)
          await expect(icon).toBeVisible()
          
          // Icons should not cause layout shift
          const boundingBox = await icon.boundingBox()
          expect(boundingBox?.width).toBeGreaterThan(0)
          expect(boundingBox?.height).toBeGreaterThan(0)
        }
      })

      await test.step('Test CSS Animation Performance', async () => {
        // Animations should not block interaction
        await page.fill('[data-testid="service-area"]', 'Central London')
        await page.fill('[data-testid="phone-number"]', '+44 7123 456789')
        await page.fill('[data-testid="bio"]', 'Experienced laundry professional with excellent service.')
        await page.check('[data-testid="availability-Monday Morning"]')
        await page.check('[data-testid="service-type-Wash & Dry"]')
        
        // Start transition
        await page.click('[data-testid="complete-profile-setup"]')
        
        // Should be able to interact during transition
        const backButton = page.locator('[data-testid="back-button"]')
        if (await backButton.isVisible()) {
          await expect(backButton).not.toBeDisabled()
        }
      })
    })
  })
})