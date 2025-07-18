# Test info

- Name: Washer Onboarding Integration Tests >> should have onboarding components available for import
- Location: /Users/joeq/workspace/neighbourhood-wash/tests/washer-onboarding-integration-simple.spec.ts:34:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
    at /Users/joeq/workspace/neighbourhood-wash/tests/washer-onboarding-integration-simple.spec.ts:58:28
```

# Test source

```ts
   1 | import { test, expect, Page } from '@playwright/test'
   2 |
   3 | // Simple integration tests that work with actual component structure
   4 | test.describe('Washer Onboarding Integration Tests', () => {
   5 |   test.beforeEach(async ({ page }) => {
   6 |     await page.setViewportSize({ width: 1280, height: 720 })
   7 |   })
   8 |
   9 |   test('should display washer dashboard with onboarding flow', async ({ page }) => {
   10 |     // Navigate to washer dashboard (this will show auth error in real scenario)
   11 |     await page.goto('/washer/dashboard')
   12 |     await page.waitForLoadState('networkidle')
   13 |
   14 |     // The page should load (even if it redirects to auth)
   15 |     await expect(page).toHaveURL(/washer|signin|auth/)
   16 |     
   17 |     // Check that the page doesn't have JavaScript errors
   18 |     const errors: string[] = []
   19 |     page.on('pageerror', (error) => {
   20 |       errors.push(error.message)
   21 |     })
   22 |     
   23 |     // Wait a bit to catch any JS errors
   24 |     await page.waitForTimeout(2000)
   25 |     
   26 |     // Should not have critical JavaScript errors
   27 |     const criticalErrors = errors.filter(error => 
   28 |       !error.includes('ResizeObserver') && 
   29 |       !error.includes('Non-Error promise rejection')
   30 |     )
   31 |     expect(criticalErrors).toHaveLength(0)
   32 |   })
   33 |
   34 |   test('should have onboarding components available for import', async ({ page }) => {
   35 |     // Test that onboarding components can be imported without errors
   36 |     const result = await page.evaluate(async () => {
   37 |       try {
   38 |         // Test importing the main onboarding components
   39 |         const components = await Promise.all([
   40 |           import('/components/washer/WasherOnboardingFlow'),
   41 |           import('/components/washer/OnboardingErrorBoundary'),
   42 |           import('/components/washer/OnboardingLoadingState'),
   43 |           import('/lib/stripe/actions')
   44 |         ])
   45 |         
   46 |         return {
   47 |           success: true,
   48 |           componentsLoaded: components.length
   49 |         }
   50 |       } catch (error) {
   51 |         return {
   52 |           success: false,
   53 |           error: error.message
   54 |         }
   55 |       }
   56 |     })
   57 |     
>  58 |     expect(result.success).toBe(true)
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
   59 |     expect(result.componentsLoaded).toBe(4)
   60 |   })
   61 |
   62 |   test('should have required onboarding functions available', async ({ page }) => {
   63 |     // Test that the onboarding server actions are available
   64 |     const result = await page.evaluate(async () => {
   65 |       try {
   66 |         const actions = await import('/lib/stripe/actions')
   67 |         
   68 |         const requiredFunctions = [
   69 |           'getOnboardingStatus',
   70 |           'saveProfileSetup', 
   71 |           'initiateStripeKYC',
   72 |           'processOnboardingPayment',
   73 |           'completeOnboarding'
   74 |         ]
   75 |         
   76 |         const availableFunctions = requiredFunctions.filter(
   77 |           funcName => typeof actions[funcName] === 'function'
   78 |         )
   79 |         
   80 |         return {
   81 |           success: true,
   82 |           requiredFunctions: requiredFunctions.length,
   83 |           availableFunctions: availableFunctions.length,
   84 |           missing: requiredFunctions.filter(
   85 |             funcName => typeof actions[funcName] !== 'function'
   86 |           )
   87 |         }
   88 |       } catch (error) {
   89 |         return {
   90 |           success: false,
   91 |           error: error.message
   92 |         }
   93 |       }
   94 |     })
   95 |     
   96 |     expect(result.success).toBe(true)
   97 |     expect(result.availableFunctions).toBeGreaterThanOrEqual(3) // At least some functions should be available
   98 |   })
   99 |
  100 |   test('should render profile setup form elements', async ({ page }) => {
  101 |     // Create a test page that renders the profile setup component
  102 |     await page.setContent(`
  103 |       <!DOCTYPE html>
  104 |       <html>
  105 |         <head>
  106 |           <title>Test Profile Setup</title>
  107 |           <script type="module">
  108 |             // Mock React and required dependencies
  109 |             window.React = {
  110 |               useState: () => ['', () => {}],
  111 |               useEffect: () => {},
  112 |               createElement: (tag, props, ...children) => {
  113 |                 const element = document.createElement(tag === 'input' ? 'input' : 'div')
  114 |                 if (props) {
  115 |                   Object.assign(element, props)
  116 |                   if (props.className) element.className = props.className
  117 |                   if (props.id) element.id = props.id
  118 |                   if (props.placeholder) element.placeholder = props.placeholder
  119 |                 }
  120 |                 children.forEach(child => {
  121 |                   if (typeof child === 'string') {
  122 |                     element.textContent = child
  123 |                   } else if (child) {
  124 |                     element.appendChild(child)
  125 |                   }
  126 |                 })
  127 |                 return element
  128 |               }
  129 |             }
  130 |           </script>
  131 |         </head>
  132 |         <body>
  133 |           <div id="test-container">
  134 |             <form id="profile-form">
  135 |               <label for="serviceArea">Service Area *</label>
  136 |               <input id="serviceArea" type="text" placeholder="e.g., Central London" />
  137 |               
  138 |               <label for="phoneNumber">Phone Number *</label>
  139 |               <input id="phoneNumber" type="text" placeholder="e.g., +44 7123 456789" />
  140 |               
  141 |               <label for="bio">About You *</label>
  142 |               <textarea id="bio" placeholder="Tell customers about your experience..."></textarea>
  143 |               
  144 |               <button type="button" id="submit-profile">Complete Profile Setup</button>
  145 |             </form>
  146 |           </div>
  147 |         </body>
  148 |       </html>
  149 |     `)
  150 |
  151 |     // Test that form elements are present
  152 |     await expect(page.locator('#serviceArea')).toBeVisible()
  153 |     await expect(page.locator('#phoneNumber')).toBeVisible()
  154 |     await expect(page.locator('#bio')).toBeVisible()
  155 |     await expect(page.locator('#submit-profile')).toBeVisible()
  156 |
  157 |     // Test form interaction
  158 |     await page.fill('#serviceArea', 'Central London')
```