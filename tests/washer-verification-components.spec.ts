import { test, expect } from '@playwright/test'

// Simplified integration tests focusing on verification components
// These tests verify the verification flow components work correctly

test.describe('Washer Verification Components Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and user state
    await page.addInitScript(() => {
      // Mock Supabase auth
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'washer'
        }
      }))
    })
  })

  test('should display verification container for unverified washer', async ({ page }) => {
    // Mock API responses for unverified washer
    await page.route('**/api/stripe/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          data: {
            canAccess: false,
            status: 'incomplete',
            accountId: null
          }
        })
      })
    })

    await page.goto('/washer/dashboard')

    // Should show verification container
    await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
    await expect(page.locator('text=Complete Your Washer Verification')).toBeVisible()
    
    // Should show verification steps
    await expect(page.locator('text=Identity Verification')).toBeVisible()
    await expect(page.locator('text=Payment Setup')).toBeVisible()
    await expect(page.locator('text=Business Information')).toBeVisible()
    
    // Should have start verification button
    await expect(page.locator('[data-testid="start-verification-btn"]')).toBeVisible()
  })

  test('should display status banner for pending verification', async ({ page }) => {
    // Mock API responses for pending verification
    await page.route('**/api/stripe/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canAccess: false,
            status: 'pending',
            accountId: 'acct_test_pending',
            requirements: {
              currently_due: [],
              eventually_due: [],
              past_due: [],
              pending_verification: ['individual.verification.document']
            }
          }
        })
      })
    })

    await page.goto('/washer/dashboard')

    // Should show status banner
    await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
    await expect(page.locator('text=Verification Under Review')).toBeVisible()
    
    // Should show limited dashboard content
    await expect(page.locator('[data-testid="verification-in-progress-content"]')).toBeVisible()
    await expect(page.locator('text=Verification in Progress')).toBeVisible()
  })

  test('should display full dashboard for verified washer', async ({ page }) => {
    // Mock API responses for verified washer
    await page.route('**/api/stripe/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canAccess: true,
            status: 'complete',
            accountId: 'acct_test_complete'
          }
        })
      })
    })

    await page.goto('/washer/dashboard')

    // Should show full dashboard
    await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    
    // Should not show verification container or status banner
    await expect(page.locator('[data-testid="verification-container"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="verification-status-banner"]')).not.toBeVisible()
  })

  test('should handle verification status requiring action', async ({ page }) => {
    // Mock API responses for verification requiring action
    await page.route('**/api/stripe/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canAccess: false,
            status: 'requires_action',
            accountId: 'acct_test_requires_action',
            requirements: {
              currently_due: ['individual.verification.additional_document'],
              eventually_due: [],
              past_due: [],
              pending_verification: []
            }
          }
        })
      })
    })

    await page.goto('/washer/dashboard')

    // Should show status banner with action required
    await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
    await expect(page.locator('text=Action Required')).toBeVisible()
    
    // Should show specific requirements
    await expect(page.locator('text=Required now:')).toBeVisible()
    await expect(page.locator('text=individual verification additional document')).toBeVisible()
    
    // Should have continue verification button
    await expect(page.locator('[data-testid="continue-verification-btn"]')).toBeVisible()
  })

  test('should handle rejected verification status', async ({ page }) => {
    // Mock API responses for rejected verification
    await page.route('**/api/stripe/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canAccess: false,
            status: 'rejected',
            accountId: 'acct_test_rejected',
            requirements: {
              currently_due: [],
              eventually_due: [],
              past_due: [],
              pending_verification: [],
              disabled_reason: 'rejected.fraud'
            }
          }
        })
      })
    })

    await page.goto('/washer/dashboard')

    // Should show status banner with rejection info
    await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
    await expect(page.locator('text=Verification Issues')).toBeVisible()
    
    // Should show disabled reason
    await expect(page.locator('text=Issue:')).toBeVisible()
    await expect(page.locator('text=rejected.fraud')).toBeVisible()
    
    // Should have contact support button
    await expect(page.locator('[data-testid="contact-support-btn"]')).toBeVisible()
    
    // Should not have continue verification button
    await expect(page.locator('[data-testid="continue-verification-btn"]')).not.toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/stripe/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    await page.goto('/washer/dashboard')

    // Should show error state or fallback to verification container
    const hasErrorAlert = await page.locator('[data-testid="error-alert"]').isVisible()
    const hasVerificationContainer = await page.locator('[data-testid="verification-container"]').isVisible()
    
    // Should show either error alert or verification container (fallback)
    expect(hasErrorAlert || hasVerificationContainer).toBe(true)
  })

  test('should handle verification callback processing', async ({ page }) => {
    // Mock successful callback processing
    await page.route('**/api/verification/callback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'complete',
            previousStatus: 'pending',
            accountId: 'acct_test_123',
            statusChanged: true
          }
        })
      })
    })

    // Mock complete verification status
    await page.route('**/api/stripe/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canAccess: true,
            status: 'complete',
            accountId: 'acct_test_123'
          }
        })
      })
    })

    // Navigate with callback parameter
    await page.goto('/washer/dashboard?connect_success=true')

    // Should process callback and show full dashboard
    await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    
    // Should not show verification components
    await expect(page.locator('[data-testid="verification-container"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="verification-status-banner"]')).not.toBeVisible()
  })

  test('should handle mobile viewport correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Mock unverified washer
    await page.route('**/api/stripe/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          data: {
            canAccess: false,
            status: 'incomplete',
            accountId: null
          }
        })
      })
    })

    await page.goto('/washer/dashboard')

    // Should show verification container on mobile
    await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
    
    // Verification steps should be responsive
    const stepsContainer = page.locator('[data-testid="verification-steps"]')
    await expect(stepsContainer).toBeVisible()
  })

  test('should show loading states during verification start', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/stripe/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accountId: 'acct_test_new'
        })
      })
    })

    // Mock unverified washer initially
    await page.route('**/api/verification/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          data: {
            canAccess: false,
            status: 'incomplete',
            accountId: null
          }
        })
      })
    })

    await page.goto('/washer/dashboard')

    // Should show verification container
    await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
    
    // Click start verification
    await page.click('[data-testid="start-verification-btn"]')
    
    // Should show loading state
    await expect(page.locator('text=Starting Verification...')).toBeVisible()
  })

  test('should handle status refresh functionality', async ({ page }) => {
    let requestCount = 0
    
    // Mock API that changes response after first call
    await page.route('**/api/stripe/**', async (route) => {
      requestCount++
      
      if (requestCount === 1) {
        // First call - pending status
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              canAccess: false,
              status: 'pending',
              accountId: 'acct_test_pending'
            }
          })
        })
      } else {
        // Second call - complete status
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              canAccess: true,
              status: 'complete',
              accountId: 'acct_test_pending'
            }
          })
        })
      }
    })

    await page.goto('/washer/dashboard')

    // Should initially show status banner
    await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
    
    // Click refresh status
    await page.click('[data-testid="refresh-status-btn"]')
    
    // Should update to show full dashboard
    await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="verification-status-banner"]')).not.toBeVisible()
    
    // Verify API was called twice
    expect(requestCount).toBe(2)
  })
})