# Test info

- Name: Washer Onboarding Integration Tests >> should handle responsive design
- Location: /Users/joeq/workspace/neighbourhood-wash/tests/washer-onboarding-integration-simple.spec.ts:357:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "1fr 1fr"
Received string:    "390px 390px"
    at /Users/joeq/workspace/neighbourhood-wash/tests/washer-onboarding-integration-simple.spec.ts:423:25
```

# Page snapshot

```yaml
- text: Step 1 Step 2 Step 3 Step 4
- textbox "Service Area"
- textbox "Phone Number"
```

# Test source

```ts
  323 |                 document.getElementById('error-message').textContent = 'Operation failed. Please try again.'
  324 |                 document.getElementById('retry-action').style.display = 'block'
  325 |                 document.getElementById('success-message').style.display = 'none'
  326 |               } else {
  327 |                 document.getElementById('error-message').style.display = 'none'
  328 |                 document.getElementById('retry-action').style.display = 'none'
  329 |                 document.getElementById('success-message').style.display = 'block'
  330 |                 document.getElementById('success-message').textContent = 'Operation completed successfully!'
  331 |               }
  332 |             }
  333 |             
  334 |             document.getElementById('trigger-error').addEventListener('click', simulateAction)
  335 |             document.getElementById('retry-action').addEventListener('click', () => {
  336 |               shouldFail = false
  337 |               simulateAction()
  338 |             })
  339 |           </script>
  340 |         </body>
  341 |       </html>
  342 |     `)
  343 |
  344 |     // Trigger error
  345 |     await page.click('#trigger-error')
  346 |     await expect(page.locator('#error-message')).toBeVisible()
  347 |     await expect(page.locator('#error-message')).toContainText('Operation failed')
  348 |     await expect(page.locator('#retry-action')).toBeVisible()
  349 |
  350 |     // Test retry
  351 |     await page.click('#retry-action')
  352 |     await expect(page.locator('#error-message')).not.toBeVisible()
  353 |     await expect(page.locator('#success-message')).toBeVisible()
  354 |     await expect(page.locator('#success-message')).toContainText('Operation completed successfully')
  355 |   })
  356 |
  357 |   test('should handle responsive design', async ({ page }) => {
  358 |     await page.setContent(`
  359 |       <!DOCTYPE html>
  360 |       <html>
  361 |         <head>
  362 |           <style>
  363 |             .onboarding-container {
  364 |               width: 100%;
  365 |               max-width: 800px;
  366 |               margin: 0 auto;
  367 |               padding: 20px;
  368 |             }
  369 |             
  370 |             .step-indicator {
  371 |               display: flex;
  372 |               justify-content: space-between;
  373 |               margin-bottom: 20px;
  374 |             }
  375 |             
  376 |             .form-grid {
  377 |               display: grid;
  378 |               grid-template-columns: 1fr;
  379 |               gap: 20px;
  380 |             }
  381 |             
  382 |             @media (min-width: 768px) {
  383 |               .form-grid {
  384 |                 grid-template-columns: 1fr 1fr;
  385 |               }
  386 |             }
  387 |             
  388 |             @media (max-width: 480px) {
  389 |               .step-indicator {
  390 |                 flex-direction: column;
  391 |                 gap: 10px;
  392 |               }
  393 |               
  394 |               .onboarding-container {
  395 |                 padding: 10px;
  396 |               }
  397 |             }
  398 |           </style>
  399 |         </head>
  400 |         <body>
  401 |           <div class="onboarding-container">
  402 |             <div class="step-indicator">
  403 |               <div class="step">Step 1</div>
  404 |               <div class="step">Step 2</div>
  405 |               <div class="step">Step 3</div>
  406 |               <div class="step">Step 4</div>
  407 |             </div>
  408 |             
  409 |             <div class="form-grid">
  410 |               <input type="text" placeholder="Service Area" />
  411 |               <input type="text" placeholder="Phone Number" />
  412 |             </div>
  413 |           </div>
  414 |         </body>
  415 |       </html>
  416 |     `)
  417 |
  418 |     // Test desktop layout
  419 |     await page.setViewportSize({ width: 1024, height: 768 })
  420 |     const desktopGrid = await page.locator('.form-grid').evaluate(el => 
  421 |       window.getComputedStyle(el).gridTemplateColumns
  422 |     )
> 423 |     expect(desktopGrid).toContain('1fr 1fr') // Two columns
      |                         ^ Error: expect(received).toContain(expected) // indexOf
  424 |
  425 |     // Test mobile layout
  426 |     await page.setViewportSize({ width: 375, height: 667 })
  427 |     const mobileGrid = await page.locator('.form-grid').evaluate(el => 
  428 |       window.getComputedStyle(el).gridTemplateColumns
  429 |     )
  430 |     expect(mobileGrid).toBe('1fr') // Single column
  431 |   })
  432 | })
```