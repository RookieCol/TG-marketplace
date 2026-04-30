import { test, expect, mockProducts, sampleProducts } from './fixtures'

test.describe('cart', () => {
  test.beforeEach(async ({ verifiedPage: page }) => {
    await mockProducts(page)
  })

  test('shows the empty state and links back to the catalog', async ({ verifiedPage: page }) => {
    await page.goto('/cart')

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible()
    await page.getByRole('button', { name: /Ver catálogo/i }).click()
    await page.waitForURL('**/catalog')
  })

  test('shows items, totals (subtotal + $3 shipping) and qty controls work', async ({
    verifiedPage: page,
  }) => {
    await page.goto('/catalog')
    const card = page.getByText('Pre-roll Lemon Haze').locator('..')
    await card.getByRole('button', { name: '+' }).click()
    await card.getByRole('button', { name: '+' }).click()

    await page.locator('button').filter({ hasText: '⌁' }).click()
    await page.waitForURL('**/cart')

    await expect(page.getByText('Pre-roll Lemon Haze')).toBeVisible()
    await expect(page.getByText('$24.00').first()).toBeVisible()
    await expect(page.getByText('$27.00').first()).toBeVisible()

    const row = page.getByText('$12.00 c/u').locator('xpath=ancestor::div[2]')
    await row.getByRole('button', { name: '+' }).click()
    await expect(page.getByText('$36.00').first()).toBeVisible()
    await expect(page.getByText('$39.00').first()).toBeVisible()

    await row.getByRole('button', { name: '−' }).click()
    await row.getByRole('button', { name: '−' }).click()
    await row.getByRole('button', { name: '−' }).click()

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible()
  })

  test('"IR A PAGAR" navigates to /checkout', async ({ verifiedPage: page }) => {
    await page.goto('/catalog')
    await page.getByText(sampleProducts[0].name).locator('..').getByRole('button', { name: '+' }).click()

    await page.locator('button').filter({ hasText: '⌁' }).click()
    await page.waitForURL('**/cart')

    await page.getByRole('button', { name: /IR A PAGAR/i }).click()
    await page.waitForURL('**/checkout')
  })
})
