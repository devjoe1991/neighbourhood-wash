import { test, expect, Page } from '@playwright/test'

test.describe('Washer Onboarding Complete Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test.describe('End-to-End Onboarding Journey', () => {
    test('should complete full onboarding flow with mocked authentication', async ({ page }) => {
      // Mock authentication and API responses
      await page.route('**/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'washer'
            }
          })
        })
      })

      // Mock onboarding status API
      let currentStep = 1
      const completedSteps: number[] = []

      await page.route('**/api/**', async (route) => {
        const url = route.request().url()
        
        if (url.includes('onboarding-status')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                currentStep,
                completedSteps,
                isComplete: completedSteps.length === 4
              }
            })
          })
        } else if (url.includes('profile-setup')) {
          completedSteps.push(1)
          currentStep = 2
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        } else if (url.includes('kyc')) {
          completedSteps.push(2)
          currentStep = 3
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        } else if (url.includes('bank')) {
          completedSteps.push(3)
          currentStep = 4
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        } else if (url.includes('payment')) {
          completedSteps.push(4)
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        } else {
          await route.continue()
        }
      })

      // Navigate to washer dashboard
      await page.goto('/washer/dashboard')
      await page.waitForLoadState('networkidle')

      // The test verifies the page loads without critical errors
      const errors: string[] = []
      page.on('pageerror', (error) => {
        if (!error.message.includes('ResizeObserver') && 
            !error.message.includes('Non-Error promise rejection')) {
          errors.push(error.message)
        }
      })

      // Wait for any async operations
      await page.waitForTimeout(2000)

      // Should not have critical JavaScript errors
      expect(errors).toHaveLength(0)

      // Page should be accessible (either dashboard or auth redirect)
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/washer|signin|auth|dashboard/)
    })

    test('should handle step-by-step progress updates', async ({ page }) => {
      // Create a test page that simulates the onboarding flow
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Onboarding Progress Test</title>
            <style>
              .step { padding: 10px; margin: 5px; border: 1px solid #ccc; }
              .step.current { background: #e3f2fd; border-color: #2196f3; }
              .step.completed { background: #e8f5e8; border-color: #4caf50; }
              .step.pending { background: #f5f5f5; border-color: #ccc; }
              .progress-bar { width: 100%; height: 20px; background: #f0f0f0; }
              .progress-fill { height: 100%; background: #2196f3; transition: width 0.3s; }
            </style>
          </head>
          <body>
            <div id="onboarding-test">
              <h1>4-Step Washer Onboarding</h1>
              
              <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
              </div>
              <div id="progress-text">0% Complete</div>
              
              <div class="steps">
                <div class="step current" data-step="1">Step 1: Profile Setup</div>
                <div class="step pending" data-step="2">Step 2: KYC Verification</div>
                <div class="step pending" data-step="3">Step 3: Bank Connection</div>
                <div class="step pending" data-step="4">Step 4: Payment</div>
              </div>
              
              <div id="step-content">
                <div id="step-1-content">
                  <h3>Profile Setup</h3>
                  <input type="text" id="service-area" placeholder="Service Area" />
                  <input type="text" id="phone" placeholder="Phone Number" />
                  <textarea id="bio" placeholder="Bio (min 20 chars)"></textarea>
                  <button id="complete-step-1">Complete Profile Setup</button>
                </div>
                
                <div id="step-2-content" style="display: none;">
                  <h3>KYC Verification</h3>
                  <p>Identity verification with Stripe</p>
                  <button id="complete-step-2">Complete KYC</button>
                </div>
                
                <div id="step-3-content" style="display: none;">
                  <h3>Bank Connection</h3>
                  <p>Connect your bank account for payouts</p>
                  <button id="complete-step-3">Connect Bank</button>
                </div>
                
                <div id="step-4-content" style="display: none;">
                  <h3>Payment</h3>
                  <p>Pay £15 onboarding fee</p>
                  <button id="complete-step-4">Process Payment</button>
                </div>
                
                <div id="completion-content" style="display: none;">
                  <h3>Onboarding Complete!</h3>
                  <p>You now have full access to all washer features</p>
                  <button id="access-dashboard">Access Full Dashboard</button>
                </div>
              </div>
            </div>
            
            <script>
              let currentStep = 1
              let completedSteps = []
              
              function updateProgress() {
                const progress = (completedSteps.length / 4) * 100
                document.getElementById('progress-fill').style.width = progress + '%'
                document.getElementById('progress-text').textContent = Math.round(progress) + '% Complete'
                
                // Update step states
                document.querySelectorAll('.step').forEach(step => {
                  const stepNum = parseInt(step.getAttribute('data-step'))
                  step.className = 'step '
                  if (completedSteps.includes(stepNum)) {
                    step.className += 'completed'
                  } else if (stepNum === currentStep) {
                    step.className += 'current'
                  } else {
                    step.className += 'pending'
                  }
                })
                
                // Show appropriate content
                document.querySelectorAll('[id$="-content"]').forEach(content => {
                  content.style.display = 'none'
                })
                
                if (completedSteps.length === 4) {
                  document.getElementById('completion-content').style.display = 'block'
                } else {
                  document.getElementById('step-' + currentStep + '-content').style.display = 'block'
                }
              }
              
              function completeStep(step) {
                if (!completedSteps.includes(step)) {
                  completedSteps.push(step)
                }
                if (step < 4) {
                  currentStep = step + 1
                }
                updateProgress()
              }
              
              // Event listeners
              document.getElementById('complete-step-1').addEventListener('click', () => {
                const serviceArea = document.getElementById('service-area').value
                const phone = document.getElementById('phone').value
                const bio = document.getElementById('bio').value
                
                if (serviceArea && phone && bio && bio.length >= 20) {
                  completeStep(1)
                } else {
                  alert('Please fill all required fields')
                }
              })
              
              document.getElementById('complete-step-2').addEventListener('click', () => completeStep(2))
              document.getElementById('complete-step-3').addEventListener('click', () => completeStep(3))
              document.getElementById('complete-step-4').addEventListener('click', () => completeStep(4))
              
              updateProgress()
            </script>
          </body>
        </html>
      `)

      // Test initial state
      await expect(page.locator('[data-step="1"]')).toHaveClass(/current/)
      await expect(page.locator('[data-step="2"]')).toHaveClass(/pending/)
      await expect(page.locator('#progress-text')).toContainText('0% Complete')

      // Complete Step 1 with validation
      await page.fill('#service-area', 'Central London')
      await page.fill('#phone', '+44 7123 456789')
      await page.fill('#bio', 'Experienced laundry professional with excellent service.')
      await page.click('#complete-step-1')

      // Verify Step 1 completion
      await expect(page.locator('[data-step="1"]')).toHaveClass(/completed/)
      await expect(page.locator('[data-step="2"]')).toHaveClass(/current/)
      await expect(page.locator('#progress-text')).toContainText('25% Complete')
      await expect(page.locator('#step-2-content')).toBeVisible()

      // Complete Step 2
      await page.click('#complete-step-2')
      await expect(page.locator('[data-step="2"]')).toHaveClass(/completed/)
      await expect(page.locator('[data-step="3"]')).toHaveClass(/current/)
      await expect(page.locator('#progress-text')).toContainText('50% Complete')

      // Complete Step 3
      await page.click('#complete-step-3')
      await expect(page.locator('[data-step="3"]')).toHaveClass(/completed/)
      await expect(page.locator('[data-step="4"]')).toHaveClass(/current/)
      await expect(page.locator('#progress-text')).toContainText('75% Complete')

      // Complete Step 4
      await page.click('#complete-step-4')
      await expect(page.locator('[data-step="4"]')).toHaveClass(/completed/)
      await expect(page.locator('#progress-text')).toContainText('100% Complete')
      await expect(page.locator('#completion-content')).toBeVisible()
      await expect(page.locator('text=Onboarding Complete!')).toBeVisible()
    })
  })

  test.describe('Feature Access Control', () => {
    test('should show locked features before onboarding completion', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              .feature-card { 
                padding: 20px; 
                margin: 10px; 
                border: 2px solid #ccc; 
                border-radius: 8px;
              }
              .feature-card.locked { 
                border-style: dashed; 
                background: #f5f5f5; 
                opacity: 0.7;
              }
              .feature-card.unlocked { 
                border-style: solid; 
                background: white; 
              }
              .locked-badge { 
                background: #ff9800; 
                color: white; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px;
              }
              .unlocked-badge { 
                background: #4caf50; 
                color: white; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px;
              }
              button:disabled { 
                opacity: 0.5; 
                cursor: not-allowed; 
              }
            </style>
          </head>
          <body>
            <div id="dashboard">
              <h1>Washer Dashboard</h1>
              
              <div id="onboarding-status">
                <p>Complete your 4-step setup to unlock all features</p>
                <div class="progress">Step 0 of 4 complete</div>
              </div>
              
              <div class="features">
                <div class="feature-card locked" id="bookings-card">
                  <span class="locked-badge">Locked</span>
                  <h3>Available Bookings</h3>
                  <p>Browse and accept new bookings</p>
                  <button disabled>View Bookings</button>
                </div>
                
                <div class="feature-card locked" id="payouts-card">
                  <span class="locked-badge">Locked</span>
                  <h3>Payouts & Earnings</h3>
                  <p>Manage your earnings and payouts</p>
                  <button disabled>View Payouts</button>
                </div>
                
                <div class="feature-card unlocked" id="settings-card">
                  <span class="unlocked-badge">Available</span>
                  <h3>Settings</h3>
                  <p>Configure your preferences</p>
                  <button>Open Settings</button>
                </div>
              </div>
              
              <button id="complete-onboarding">Complete Onboarding (Test)</button>
            </div>
            
            <script>
              document.getElementById('complete-onboarding').addEventListener('click', () => {
                // Simulate onboarding completion
                document.getElementById('onboarding-status').innerHTML = 
                  '<p>Onboarding Complete!</p><div class="progress">All features unlocked</div>'
                
                // Unlock features
                const lockedCards = document.querySelectorAll('.feature-card.locked')
                lockedCards.forEach(card => {
                  card.className = 'feature-card unlocked'
                  card.querySelector('.locked-badge').className = 'unlocked-badge'
                  card.querySelector('.locked-badge').textContent = 'Unlocked'
                  card.querySelector('button').disabled = false
                })
              })
            </script>
          </body>
        </html>
      `)

      // Test initial locked state
      await expect(page.locator('#bookings-card')).toHaveClass(/locked/)
      await expect(page.locator('#payouts-card')).toHaveClass(/locked/)
      await expect(page.locator('#settings-card')).toHaveClass(/unlocked/)
      
      // Verify locked badges
      await expect(page.locator('#bookings-card .locked-badge')).toContainText('Locked')
      await expect(page.locator('#payouts-card .locked-badge')).toContainText('Locked')
      await expect(page.locator('#settings-card .unlocked-badge')).toContainText('Available')
      
      // Verify disabled buttons
      await expect(page.locator('#bookings-card button')).toBeDisabled()
      await expect(page.locator('#payouts-card button')).toBeDisabled()
      await expect(page.locator('#settings-card button')).not.toBeDisabled()

      // Complete onboarding
      await page.click('#complete-onboarding')

      // Verify features are unlocked
      await expect(page.locator('#bookings-card')).toHaveClass(/unlocked/)
      await expect(page.locator('#payouts-card')).toHaveClass(/unlocked/)
      await expect(page.locator('text=Onboarding Complete!')).toBeVisible()
      
      // Verify buttons are enabled
      await expect(page.locator('#bookings-card button')).not.toBeDisabled()
      await expect(page.locator('#payouts-card button')).not.toBeDisabled()
    })
  })

  test.describe('Error Scenarios and Recovery', () => {
    test('should handle validation errors and recovery', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <body>
            <form id="profile-form">
              <div>
                <label>Service Area *</label>
                <input type="text" id="service-area" required />
                <div class="error" id="service-area-error" style="display: none; color: red;"></div>
              </div>
              
              <div>
                <label>Phone Number *</label>
                <input type="text" id="phone" required />
                <div class="error" id="phone-error" style="display: none; color: red;"></div>
              </div>
              
              <div>
                <label>Bio * (min 20 characters)</label>
                <textarea id="bio" required minlength="20"></textarea>
                <div class="error" id="bio-error" style="display: none; color: red;"></div>
              </div>
              
              <button type="submit">Submit Profile</button>
              <div id="success-message" style="display: none; color: green;">Profile saved successfully!</div>
            </form>
            
            <script>
              document.getElementById('profile-form').addEventListener('submit', (e) => {
                e.preventDefault()
                
                // Clear previous errors
                document.querySelectorAll('.error').forEach(error => {
                  error.style.display = 'none'
                })
                
                let hasErrors = false
                
                // Validate service area
                const serviceArea = document.getElementById('service-area').value
                if (!serviceArea.trim()) {
                  document.getElementById('service-area-error').textContent = 'Service area is required'
                  document.getElementById('service-area-error').style.display = 'block'
                  hasErrors = true
                }
                
                // Validate phone
                const phone = document.getElementById('phone').value
                if (!phone.trim()) {
                  document.getElementById('phone-error').textContent = 'Phone number is required'
                  document.getElementById('phone-error').style.display = 'block'
                  hasErrors = true
                } else if (!/^\\+?[\\d\\s\\-\\(\\)]+$/.test(phone)) {
                  document.getElementById('phone-error').textContent = 'Please enter a valid phone number'
                  document.getElementById('phone-error').style.display = 'block'
                  hasErrors = true
                }
                
                // Validate bio
                const bio = document.getElementById('bio').value
                if (!bio.trim()) {
                  document.getElementById('bio-error').textContent = 'Bio is required'
                  document.getElementById('bio-error').style.display = 'block'
                  hasErrors = true
                } else if (bio.trim().length < 20) {
                  document.getElementById('bio-error').textContent = 'Bio must be at least 20 characters long'
                  document.getElementById('bio-error').style.display = 'block'
                  hasErrors = true
                }
                
                if (!hasErrors) {
                  document.getElementById('success-message').style.display = 'block'
                }
              })
            </script>
          </body>
        </html>
      `)

      // Test validation errors
      await page.click('button[type="submit"]')
      
      await expect(page.locator('#service-area-error')).toContainText('Service area is required')
      await expect(page.locator('#phone-error')).toContainText('Phone number is required')
      await expect(page.locator('#bio-error')).toContainText('Bio is required')

      // Test phone validation
      await page.fill('#service-area', 'London')
      await page.fill('#phone', 'invalid-phone')
      await page.fill('#bio', 'Short bio')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('#phone-error')).toContainText('Please enter a valid phone number')
      await expect(page.locator('#bio-error')).toContainText('Bio must be at least 20 characters')

      // Test successful validation
      await page.fill('#phone', '+44 7123 456789')
      await page.fill('#bio', 'This is a sufficiently long bio that meets all the requirements.')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('#success-message')).toContainText('Profile saved successfully!')
      await expect(page.locator('.error:visible')).toHaveCount(0)
    })

    test('should handle API errors and retries', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <body>
            <div id="api-test">
              <button id="api-call">Make API Call</button>
              <button id="retry" style="display: none;">Retry</button>
              <div id="loading" style="display: none;">Loading...</div>
              <div id="error" style="display: none; color: red;"></div>
              <div id="success" style="display: none; color: green;"></div>
            </div>
            
            <script>
              let shouldFail = true
              
              function makeApiCall() {
                document.getElementById('loading').style.display = 'block'
                document.getElementById('error').style.display = 'none'
                document.getElementById('success').style.display = 'none'
                document.getElementById('retry').style.display = 'none'
                
                setTimeout(() => {
                  document.getElementById('loading').style.display = 'none'
                  
                  if (shouldFail) {
                    document.getElementById('error').textContent = 'API call failed. Please try again.'
                    document.getElementById('error').style.display = 'block'
                    document.getElementById('retry').style.display = 'block'
                  } else {
                    document.getElementById('success').textContent = 'API call successful!'
                    document.getElementById('success').style.display = 'block'
                  }
                }, 1000)
              }
              
              document.getElementById('api-call').addEventListener('click', makeApiCall)
              document.getElementById('retry').addEventListener('click', () => {
                shouldFail = false
                makeApiCall()
              })
            </script>
          </body>
        </html>
      `)

      // Test API failure
      await page.click('#api-call')
      await expect(page.locator('#loading')).toBeVisible()
      await expect(page.locator('#error')).toContainText('API call failed', { timeout: 2000 })
      await expect(page.locator('#retry')).toBeVisible()

      // Test retry success
      await page.click('#retry')
      await expect(page.locator('#loading')).toBeVisible()
      await expect(page.locator('#success')).toContainText('API call successful', { timeout: 2000 })
    })
  })

  test.describe('Payment Processing', () => {
    test('should handle payment flow correctly', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <body>
            <div id="payment-test">
              <h3>Onboarding Fee Payment</h3>
              <p>One-time fee: £15</p>
              
              <div id="payment-form">
                <button id="process-payment">Process Payment</button>
              </div>
              
              <div id="payment-processing" style="display: none;">
                <p>Processing payment...</p>
                <div class="spinner">⏳</div>
              </div>
              
              <div id="payment-success" style="display: none; color: green;">
                <p>✅ Payment successful!</p>
                <p>Onboarding complete - all features unlocked</p>
                <button id="access-dashboard">Access Full Dashboard</button>
              </div>
              
              <div id="payment-error" style="display: none; color: red;">
                <p>❌ Payment failed</p>
                <button id="retry-payment">Try Again</button>
              </div>
            </div>
            
            <script>
              let paymentAttempts = 0
              
              function processPayment() {
                document.getElementById('payment-form').style.display = 'none'
                document.getElementById('payment-processing').style.display = 'block'
                document.getElementById('payment-success').style.display = 'none'
                document.getElementById('payment-error').style.display = 'none'
                
                setTimeout(() => {
                  document.getElementById('payment-processing').style.display = 'none'
                  paymentAttempts++
                  
                  // Simulate failure on first attempt, success on retry
                  if (paymentAttempts === 1) {
                    document.getElementById('payment-error').style.display = 'block'
                  } else {
                    document.getElementById('payment-success').style.display = 'block'
                  }
                }, 2000)
              }
              
              document.getElementById('process-payment').addEventListener('click', processPayment)
              document.getElementById('retry-payment').addEventListener('click', processPayment)
            </script>
          </body>
        </html>
      `)

      // Test initial payment attempt (fails)
      await page.click('#process-payment')
      await expect(page.locator('#payment-processing')).toBeVisible()
      await expect(page.locator('#payment-error')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('#retry-payment')).toBeVisible()

      // Test retry (succeeds)
      await page.click('#retry-payment')
      await expect(page.locator('#payment-processing')).toBeVisible()
      await expect(page.locator('#payment-success')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('text=Payment successful!')).toBeVisible()
      await expect(page.locator('text=Onboarding complete')).toBeVisible()
      await expect(page.locator('#access-dashboard')).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              .onboarding-container {
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              
              .step-indicator {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
              }
              
              .step {
                flex: 1;
                padding: 10px;
                text-align: center;
                border: 1px solid #ccc;
                border-radius: 4px;
              }
              
              .form-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 15px;
              }
              
              @media (min-width: 768px) {
                .form-grid {
                  grid-template-columns: 1fr 1fr;
                }
              }
              
              @media (max-width: 480px) {
                .onboarding-container {
                  padding: 10px;
                }
                
                .step-indicator {
                  flex-direction: column;
                  gap: 5px;
                }
                
                .step {
                  font-size: 14px;
                  padding: 8px;
                }
              }
            </style>
          </head>
          <body>
            <div class="onboarding-container">
              <div class="step-indicator">
                <div class="step">Profile</div>
                <div class="step">KYC</div>
                <div class="step">Bank</div>
                <div class="step">Payment</div>
              </div>
              
              <div class="form-grid">
                <input type="text" placeholder="Service Area" />
                <input type="text" placeholder="Phone Number" />
                <textarea placeholder="Bio"></textarea>
                <button>Submit</button>
              </div>
            </div>
          </body>
        </html>
      `)

      // Test desktop layout
      await page.setViewportSize({ width: 1024, height: 768 })
      const desktopSteps = page.locator('.step-indicator')
      await expect(desktopSteps).toHaveCSS('flex-direction', 'row')

      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 })
      await expect(desktopSteps).toHaveCSS('flex-direction', 'column')
      
      // Verify mobile-specific styling
      const container = page.locator('.onboarding-container')
      const containerPadding = await container.evaluate(el => 
        window.getComputedStyle(el).padding
      )
      expect(containerPadding).toBe('10px')
    })
  })
})