import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Neighbourhood Wash/)
})

test('get started link', async ({ page }) => {
  await page.goto('/')

  // Click the get started link.
  await page.getByRole('link', { name: 'Get Started' }).click()

  // Expects page to have a heading with the name of Installation.
  // This will fail as the register page is a placeholder, but it's a start.
  await expect(
    page.getByRole('heading', { name: 'Register Page Placeholder' })
  ).toBeVisible()
})
