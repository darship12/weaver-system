import { test, expect } from '@playwright/test'

test('login page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Weaver/)
  await expect(page.locator('text=Sign In')).toBeVisible()
})

test('redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/login/)
})

test('login with valid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[placeholder*="username"]', 'admin')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/dashboard/)
})
