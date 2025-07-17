import { test, expect, Page } from '@playwright/test'

// Test utilities for callback handling
async function mockStripeAccount(page: Page, status: string, accountId: string = 'acct_test_123') {
  const accountData = {
    incomplete: {
      id: accountId,
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
    pending: {
      id: accountId,
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
    complete: {
      id: accountId,
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
    requires_action: {
      id: accountId,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: true,
      requirements: {
        currently_due: ['individual.verification.additional_document'],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      }
    }
  }

  await page.route('**/api/stripe/**', async (route) => {
    const url = route.request().url()
    
    if (url.includes('/accounts/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(accountData[status as keyof typeof accountData])
      })
    } else {
      await route.continue()
    }
  })
}

async function mockCallbackAPI(page: Page, shouldSucceed: boolean = true, delay: number = 0) {
  await page.route('**/api/verification/callback', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    if (shouldSucceed) {
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
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            type: 'unknown_error',
            message: 'Callback processing failed'
          }
        })
      })
    }
  })
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

test.describe('Washer Verification Callback Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Successful Callback Processing', () => {
    test('should process verification completion callback', async ({ page }) => {
      // Start with pending verification
      await mockStripeAccount(page, 'pending')
      await mockCallbackAPI(page, true)
      await createTestWasher(page)
      
      // Simulate return from Stripe with success callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should show callback processing indicator
      await expect(page.locator('[data-testid="callback-processing"]')).toBeVisible()
      
      // Update mock to complete status
      await mockStripeAccount(page, 'complete')
      
      // Should show completion notification
      await expect(page.locator('[data-testid="verification-complete-toast"]')).toBeVisible()
      
      // Should update UI to show full dashboard
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
      await expect(page.locator('[data-testid="verification-status-banner"]')).not.toBeVisible()
    })

    test('should handle callback with status change from incomplete to complete', async ({ page }) => {
      await mockStripeAccount(page, 'incomplete')
      await createTestWasher(page)
      
      // Should show verification container
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      // Mock successful callback processing
      await mockCallbackAPI(page, true)
      await mockStripeAccount(page, 'complete')
      
      // Simulate callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should process callback and update status
      await expect(page.locator('[data-testid="callback-processing"]')).toBeVisible()
      
      // Should show success notification
      await expect(page.locator('text=Verification Complete')).toBeVisible()
      
      // Should now show full dashboard
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    })

    test('should handle callback with no status change', async ({ page }) => {
      await mockStripeAccount(page, 'pending')
      await createTestWasher(page)
      
      // Mock callback that doesn't change status
      await page.route('**/api/verification/callback', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              status: 'pending',
              previousStatus: 'pending',
              accountId: 'acct_test_123',
              statusChanged: false
            }
          })
        })
      })
      
      // Simulate callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should process callback without showing change notification
      await expect(page.locator('[data-testid="callback-processing"]')).toBeVisible()
      
      // Should not show status change toast
      await expect(page.locator('[data-testid="verification-complete-toast"]')).not.toBeVisible()
      
      // Should maintain current UI state
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
    })
  })

  test.describe('Callback Error Handling', () => {
    test('should handle callback processing failures', async ({ page }) => {
      await mockStripeAccount(page, 'pending')
      await mockCallbackAPI(page, false)
      await createTestWasher(page)
      
      // Simulate callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should show error state
      await expect(page.locator('[data-testid="callback-error"]')).toBeVisible()
      await expect(page.locator('text=Failed to process verification callback')).toBeVisible()
      
      // Should have retry option
      await expect(page.locator('[data-testid="retry-callback-btn"]')).toBeVisible()
      
      // Fix the callback API and retry
      await mockCallbackAPI(page, true)
      await page.click('[data-testid="retry-callback-btn"]')
      
      // Should now succeed
      await expect(page.locator('[data-testid="callback-processing"]')).toBeVisible()
    })

    test('should handle callback timeout', async ({ page }) => {
      await mockStripeAccount(page, 'pending')
      await mockCallbackAPI(page, true, 10000) // 10 second delay
      await createTestWasher(page)
      
      // Simulate callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should show timeout error after reasonable wait
      await expect(page.locator('text=Callback processing timed out')).toBeVisible({ timeout: 8000 })
      
      // Should have retry option
      await expect(page.locator('[data-testid="retry-callback-btn"]')).toBeVisible()
    })

    test('should handle multiple callback attempts', async ({ page }) => {
      let callbackCount = 0
      
      await page.route('**/api/verification/callback', async (route) => {
        callbackCount++
        if (callbackCount <= 2) {
          // Fail first 2 attempts
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          })
        } else {
          // Succeed on 3rd attempt
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
        }
      })
      
      await mockStripeAccount(page, 'pending')
      await createTestWasher(page)
      
      // Simulate callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should eventually succeed after retries
      await expect(page.locator('[data-testid="verification-complete-toast"]')).toBeVisible({ timeout: 10000 })
      
      // Verify retry attempts were made
      expect(callbackCount).toBe(3)
    })
  })

  test.describe('Status Synchronization', () => {
    test('should synchronize status with Stripe API', async ({ page }) => {
      // Start with cached incomplete status
      await mockStripeAccount(page, 'incomplete')
      await createTestWasher(page)
      
      // Should show verification container
      await expect(page.locator('[data-testid="verification-container"]')).toBeVisible()
      
      // Update Stripe API to return complete status
      await mockStripeAccount(page, 'complete')
      
      // Trigger status sync
      await page.click('[data-testid="refresh-status-btn"]')
      
      // Should update local status to match Stripe
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
      
      // Verify status was persisted by reloading page
      await page.reload()
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    })

    test('should handle status sync failures gracefully', async ({ page }) => {
      await mockStripeAccount(page, 'pending')
      await createTestWasher(page)
      
      // Mock status sync failure
      await page.route('**/api/stripe/accounts/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'API error' })
        })
      })
      
      // Try to refresh status
      await page.click('[data-testid="refresh-status-btn"]')
      
      // Should show error but maintain current state
      await expect(page.locator('text=Failed to refresh status')).toBeVisible()
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
      
      // Should still have retry option
      await expect(page.locator('[data-testid="refresh-status-btn"]')).toBeVisible()
    })

    test('should batch multiple status update requests', async ({ page }) => {
      let requestCount = 0
      
      await page.route('**/api/stripe/accounts/**', async (route) => {
        requestCount++
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'acct_test_123',
            charges_enabled: true,
            payouts_enabled: true,
            details_submitted: true
          })
        })
      })
      
      await mockStripeAccount(page, 'pending')
      await createTestWasher(page)
      
      // Trigger multiple status updates simultaneously
      const refreshPromises = [
        page.click('[data-testid="refresh-status-btn"]'),
        page.click('[data-testid="refresh-status-btn"]'),
        page.click('[data-testid="refresh-status-btn"]')
      ]
      
      await Promise.all(refreshPromises)
      
      // Should batch requests to avoid duplicate API calls
      expect(requestCount).toBeLessThanOrEqual(2) // Allow for some race conditions
      
      // Should still update status correctly
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
    })
  })

  test.describe('Real-time Status Updates', () => {
    test('should handle webhook-triggered status updates', async ({ page }) => {
      await mockStripeAccount(page, 'pending')
      await createTestWasher(page)
      
      // Should show pending status
      await expect(page.locator('text=Verification Under Review')).toBeVisible()
      
      // Simulate webhook updating status in database
      await page.evaluate(() => {
        // Simulate real-time database update
        window.dispatchEvent(new CustomEvent('verification-status-updated', {
          detail: { status: 'complete', accountId: 'acct_test_123' }
        }))
      })
      
      // Should update UI in real-time
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
      await expect(page.locator('[data-testid="verification-status-banner"]')).not.toBeVisible()
    })

    test('should handle conflicting status updates', async ({ page }) => {
      await mockStripeAccount(page, 'pending')
      await createTestWasher(page)
      
      // Simulate conflicting updates
      await page.evaluate(() => {
        // First update
        window.dispatchEvent(new CustomEvent('verification-status-updated', {
          detail: { status: 'complete', accountId: 'acct_test_123', timestamp: Date.now() }
        }))
        
        // Conflicting update with older timestamp
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('verification-status-updated', {
            detail: { status: 'pending', accountId: 'acct_test_123', timestamp: Date.now() - 5000 }
          }))
        }, 100)
      })
      
      // Should use the most recent update
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
      
      // Should not revert to older status
      await page.waitForTimeout(500)
      await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
    })
  })

  test.describe('Callback URL Handling', () => {
    test('should handle various callback URL formats', async ({ page }) => {
      await mockStripeAccount(page, 'complete')
      await mockCallbackAPI(page, true)
      await createTestWasher(page)
      
      // Test different callback URL formats
      const callbackUrls = [
        '/washer/dashboard?connect_success=true',
        '/washer/dashboard?connect_success=true&account_id=acct_test_123',
        '/washer/dashboard?connect_success=true&state=verification_complete',
        '/washer/dashboard?connect_success=1',
      ]
      
      for (const url of callbackUrls) {
        await page.goto(url)
        
        // Should process callback for all formats
        await expect(page.locator('[data-testid="callback-processing"]')).toBeVisible()
        
        // Should show success state
        await expect(page.locator('[data-testid="washer-dashboard-content"]')).toBeVisible()
      }
    })

    test('should handle callback with error parameters', async ({ page }) => {
      await mockStripeAccount(page, 'pending')
      await createTestWasher(page)
      
      // Simulate callback with error
      await page.goto('/washer/dashboard?connect_error=true&error_description=verification_failed')
      
      // Should show error state
      await expect(page.locator('[data-testid="callback-error"]')).toBeVisible()
      await expect(page.locator('text=verification_failed')).toBeVisible()
      
      // Should provide recovery options
      await expect(page.locator('[data-testid="retry-verification-btn"]')).toBeVisible()
    })

    test('should ignore invalid callback parameters', async ({ page }) => {
      await mockStripeAccount(page, 'pending')
      await createTestWasher(page)
      
      // Navigate with invalid callback parameters
      await page.goto('/washer/dashboard?invalid_param=true&malicious_script=<script>alert("xss")</script>')
      
      // Should not process invalid callbacks
      await expect(page.locator('[data-testid="callback-processing"]')).not.toBeVisible()
      
      // Should show normal dashboard state
      await expect(page.locator('[data-testid="verification-status-banner"]')).toBeVisible()
      
      // Should not execute any malicious scripts
      const alertDialogs = await page.locator('text=xss').count()
      expect(alertDialogs).toBe(0)
    })
  })

  test.describe('Audit Logging', () => {
    test('should log callback processing events', async ({ page }) => {
      await mockStripeAccount(page, 'complete')
      await mockCallbackAPI(page, true)
      
      // Monitor console logs
      const logs: string[] = []
      page.on('console', msg => {
        if (msg.text().includes('[VERIFICATION_AUDIT]')) {
          logs.push(msg.text())
        }
      })
      
      await createTestWasher(page)
      
      // Simulate callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      // Should log callback processing
      await page.waitForTimeout(1000)
      
      // Verify audit logs were created
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some(log => log.includes('callback_processed'))).toBe(true)
      expect(logs.some(log => log.includes('status_updated'))).toBe(true)
    })

    test('should log verification completion events', async ({ page }) => {
      await mockStripeAccount(page, 'complete')
      await mockCallbackAPI(page, true)
      
      const logs: string[] = []
      page.on('console', msg => {
        if (msg.text().includes('[VERIFICATION_AUDIT]')) {
          logs.push(msg.text())
        }
      })
      
      await createTestWasher(page)
      
      // Simulate verification completion callback
      await page.goto('/washer/dashboard?connect_success=true')
      
      await page.waitForTimeout(1000)
      
      // Should log verification completion
      expect(logs.some(log => log.includes('verification_completed'))).toBe(true)
    })
  })
})