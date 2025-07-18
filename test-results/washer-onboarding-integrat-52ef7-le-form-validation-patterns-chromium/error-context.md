# Test info

- Name: Washer Onboarding Integration Tests >> should handle form validation patterns
- Location: /Users/joeq/workspace/neighbourhood-wash/tests/washer-onboarding-integration-simple.spec.ts:168:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Matcher error: received value must not be null nor undefined

Received has value: null
    at /Users/joeq/workspace/neighbourhood-wash/tests/washer-onboarding-integration-simple.spec.ts:212:20
```

# Page snapshot

```yaml
- textbox: invalid-phone
- textbox
- textbox: Short
- button "Submit"
```

# Test source

```ts
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
  159 |     await page.fill('#phoneNumber', '+44 7123 456789')
  160 |     await page.fill('#bio', 'Experienced laundry professional with excellent service.')
  161 |
  162 |     // Verify values were set
  163 |     await expect(page.locator('#serviceArea')).toHaveValue('Central London')
  164 |     await expect(page.locator('#phoneNumber')).toHaveValue('+44 7123 456789')
  165 |     await expect(page.locator('#bio')).toHaveValue('Experienced laundry professional with excellent service.')
  166 |   })
  167 |
  168 |   test('should handle form validation patterns', async ({ page }) => {
  169 |     await page.setContent(`
  170 |       <!DOCTYPE html>
  171 |       <html>
  172 |         <body>
  173 |           <form id="validation-test">
  174 |             <input id="phone" type="text" pattern="^\\+?[\\d\\s\\-\\(\\)]+$" />
  175 |             <input id="email" type="email" />
  176 |             <textarea id="bio" minlength="20"></textarea>
  177 |             <button type="submit">Submit</button>
  178 |           </form>
  179 |           <script>
  180 |             document.getElementById('validation-test').addEventListener('submit', (e) => {
  181 |               e.preventDefault()
  182 |               const phone = document.getElementById('phone')
  183 |               const bio = document.getElementById('bio')
  184 |               
  185 |               let errors = []
  186 |               
  187 |               if (!phone.value.match(/^\\+?[\\d\\s\\-\\(\\)]+$/)) {
  188 |                 errors.push('Invalid phone number')
  189 |               }
  190 |               
  191 |               if (bio.value.length < 20) {
  192 |                 errors.push('Bio too short')
  193 |               }
  194 |               
  195 |               if (errors.length > 0) {
  196 |                 document.body.setAttribute('data-validation-errors', errors.join(', '))
  197 |               } else {
  198 |                 document.body.setAttribute('data-validation-success', 'true')
  199 |               }
  200 |             })
  201 |           </script>
  202 |         </body>
  203 |       </html>
  204 |     `)
  205 |
  206 |     // Test invalid phone number
  207 |     await page.fill('#phone', 'invalid-phone')
  208 |     await page.fill('#bio', 'Short')
  209 |     await page.click('button[type="submit"]')
  210 |     
  211 |     const errors = await page.getAttribute('body', 'data-validation-errors')
> 212 |     expect(errors).toContain('Invalid phone number')
      |                    ^ Error: expect(received).toContain(expected) // indexOf
  213 |     expect(errors).toContain('Bio too short')
  214 |
  215 |     // Test valid input
  216 |     await page.fill('#phone', '+44 7123 456789')
  217 |     await page.fill('#bio', 'This is a sufficiently long bio that meets the minimum requirements.')
  218 |     await page.click('button[type="submit"]')
  219 |     
  220 |     const success = await page.getAttribute('body', 'data-validation-success')
  221 |     expect(success).toBe('true')
  222 |   })
  223 |
  224 |   test('should handle step progression logic', async ({ page }) => {
  225 |     await page.setContent(`
  226 |       <!DOCTYPE html>
  227 |       <html>
  228 |         <body>
  229 |           <div id="step-container">
  230 |             <div class="step" data-step="1" data-status="current">Step 1: Profile Setup</div>
  231 |             <div class="step" data-step="2" data-status="pending">Step 2: KYC Verification</div>
  232 |             <div class="step" data-step="3" data-status="pending">Step 3: Bank Connection</div>
  233 |             <div class="step" data-step="4" data-status="pending">Step 4: Payment</div>
  234 |             
  235 |             <div id="progress-bar" data-progress="0">0% Complete</div>
  236 |             
  237 |             <button id="complete-step">Complete Current Step</button>
  238 |           </div>
  239 |           
  240 |           <script>
  241 |             let currentStep = 1
  242 |             let completedSteps = []
  243 |             
  244 |             function updateProgress() {
  245 |               const progress = (completedSteps.length / 4) * 100
  246 |               document.getElementById('progress-bar').setAttribute('data-progress', progress.toString())
  247 |               document.getElementById('progress-bar').textContent = Math.round(progress) + '% Complete'
  248 |               
  249 |               // Update step statuses
  250 |               document.querySelectorAll('.step').forEach(step => {
  251 |                 const stepNum = parseInt(step.getAttribute('data-step'))
  252 |                 if (completedSteps.includes(stepNum)) {
  253 |                   step.setAttribute('data-status', 'completed')
  254 |                 } else if (stepNum === currentStep) {
  255 |                   step.setAttribute('data-status', 'current')
  256 |                 } else {
  257 |                   step.setAttribute('data-status', 'pending')
  258 |                 }
  259 |               })
  260 |             }
  261 |             
  262 |             document.getElementById('complete-step').addEventListener('click', () => {
  263 |               if (!completedSteps.includes(currentStep)) {
  264 |                 completedSteps.push(currentStep)
  265 |               }
  266 |               
  267 |               if (currentStep < 4) {
  268 |                 currentStep++
  269 |               }
  270 |               
  271 |               updateProgress()
  272 |             })
  273 |             
  274 |             updateProgress()
  275 |           </script>
  276 |         </body>
  277 |       </html>
  278 |     `)
  279 |
  280 |     // Test initial state
  281 |     await expect(page.locator('[data-step="1"]')).toHaveAttribute('data-status', 'current')
  282 |     await expect(page.locator('[data-step="2"]')).toHaveAttribute('data-status', 'pending')
  283 |     await expect(page.locator('#progress-bar')).toHaveAttribute('data-progress', '0')
  284 |
  285 |     // Complete step 1
  286 |     await page.click('#complete-step')
  287 |     await expect(page.locator('[data-step="1"]')).toHaveAttribute('data-status', 'completed')
  288 |     await expect(page.locator('[data-step="2"]')).toHaveAttribute('data-status', 'current')
  289 |     await expect(page.locator('#progress-bar')).toHaveAttribute('data-progress', '25')
  290 |
  291 |     // Complete step 2
  292 |     await page.click('#complete-step')
  293 |     await expect(page.locator('[data-step="2"]')).toHaveAttribute('data-status', 'completed')
  294 |     await expect(page.locator('[data-step="3"]')).toHaveAttribute('data-status', 'current')
  295 |     await expect(page.locator('#progress-bar')).toHaveAttribute('data-progress', '50')
  296 |
  297 |     // Complete remaining steps
  298 |     await page.click('#complete-step')
  299 |     await expect(page.locator('#progress-bar')).toHaveAttribute('data-progress', '75')
  300 |     
  301 |     await page.click('#complete-step')
  302 |     await expect(page.locator('#progress-bar')).toHaveAttribute('data-progress', '100')
  303 |   })
  304 |
  305 |   test('should handle error states and recovery', async ({ page }) => {
  306 |     await page.setContent(`
  307 |       <!DOCTYPE html>
  308 |       <html>
  309 |         <body>
  310 |           <div id="error-test">
  311 |             <button id="trigger-error">Trigger Error</button>
  312 |             <button id="retry-action" style="display: none;">Retry</button>
```