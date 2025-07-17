# Test info

- Name: Onboarding Payment Integration >> should handle payment processing functions
- Location: /Users/joeq/workspace/neighbourhood-wash/tests/onboarding-payment-integration.spec.ts:25:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: undefined
    at /Users/joeq/workspace/neighbourhood-wash/tests/onboarding-payment-integration.spec.ts:42:45
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test'
   2 |
   3 | test.describe('Onboarding Payment Integration', () => {
   4 |   test('should display payment step correctly', async ({ page }) => {
   5 |     // This is a basic integration test to verify the payment step renders
   6 |     // In a real scenario, you would need to set up proper authentication and test data
   7 |     
   8 |     // Navigate to a test page that includes the PaymentStep component
   9 |     // For now, we'll just verify the component can be imported without errors
  10 |     await page.goto('/')
  11 |     
  12 |     // Verify the page loads without JavaScript errors
  13 |     const errors: string[] = []
  14 |     page.on('pageerror', (error) => {
  15 |       errors.push(error.message)
  16 |     })
  17 |     
  18 |     // Wait for the page to load
  19 |     await page.waitForLoadState('networkidle')
  20 |     
  21 |     // Check that no JavaScript errors occurred during page load
  22 |     expect(errors).toHaveLength(0)
  23 |   })
  24 |
  25 |   test('should handle payment processing functions', async ({ page }) => {
  26 |     // Test that the payment processing functions are available
  27 |     const result = await page.evaluate(async () => {
  28 |       try {
  29 |         // Import the functions to verify they exist and can be loaded
  30 |         const { processOnboardingPayment, confirmOnboardingPayment, completeOnboarding } = await import('/lib/stripe/actions')
  31 |         
  32 |         return {
  33 |           processOnboardingPayment: typeof processOnboardingPayment === 'function',
  34 |           confirmOnboardingPayment: typeof confirmOnboardingPayment === 'function',
  35 |           completeOnboarding: typeof completeOnboarding === 'function'
  36 |         }
  37 |       } catch (error) {
  38 |         return { error: error.message }
  39 |       }
  40 |     })
  41 |     
> 42 |     expect(result.processOnboardingPayment).toBe(true)
     |                                             ^ Error: expect(received).toBe(expected) // Object.is equality
  43 |     expect(result.confirmOnboardingPayment).toBe(true)
  44 |     expect(result.completeOnboarding).toBe(true)
  45 |   })
  46 | })
```