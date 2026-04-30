import { test, expect, mockProducts, sampleProducts } from './fixtures'

test.describe('catalog', () => {
  test.beforeEach(async ({ verifiedPage: page }) => {
    await mockProducts(page)
  })

  test('renders all products from the API', async ({ verifiedPage: page }) => {
    await page.goto('/catalog')

    for (const p of sampleProducts) {
      await expect(page.getByText(p.name)).toBeVisible()
    }
    await expect(page.getByText('$12.00').first()).toBeVisible()
  })

  test('category filter narrows the grid', async ({ verifiedPage: page }) => {
    await page.goto('/catalog')

    await page.getByRole('button', { name: 'Pre-rolls' }).click()

    await expect(page.getByText('Pre-roll Lemon Haze')).toBeVisible()
    await expect(page.getByText('Gomitas Indica 10mg')).toHaveCount(0)
    await expect(page.getByText('Aceite CBD Full Spectrum')).toHaveCount(0)

    await page.getByRole('button', { name: 'Todos' }).click()
    await expect(page.getByText('Gomitas Indica 10mg')).toBeVisible()
  })

  test('opens the product sheet when a card is tapped', async ({ verifiedPage: page }) => {
    await page.goto('/catalog')

    await page.getByText('Aceite CBD Full Spectrum').click()

    await expect(page.getByRole('button', { name: /AÑADIR AL CARRITO/i })).toBeVisible()
    await expect(page.getByText('Aceite CBD 1000mg.')).toBeVisible()
  })

  test('quick-add button on a card increments the cart badge', async ({ verifiedPage: page }) => {
    await page.goto('/catalog')

    const card = page.getByText('Pre-roll Lemon Haze').locator('..')
    await card.getByRole('button', { name: '+' }).click()

    const cartButton = page.locator('button').filter({ hasText: '⌁' })
    await expect(cartButton.locator('span').last()).toHaveText('1')
  })

  test('product sheet quantity selector adds the chosen amount to the cart', async ({
    verifiedPage: page,
  }) => {
    await page.goto('/catalog')

    await page.getByText('Gomitas Indica 10mg').click()
    await expect(page.getByRole('button', { name: /AÑADIR AL CARRITO/i })).toBeVisible()

    const qty = page.getByRole('button', { name: '−' }).locator('..')
    await qty.getByRole('button', { name: '+' }).click()
    await qty.getByRole('button', { name: '+' }).click()

    await expect(page.getByText('$60.00')).toBeVisible()

    await page.getByRole('button', { name: /AÑADIR AL CARRITO/i }).click()

    const cartButton = page.locator('button').filter({ hasText: '⌁' })
    await expect(cartButton.locator('span').last()).toHaveText('3')
  })

  test('cart icon navigates to /cart', async ({ verifiedPage: page }) => {
    await page.goto('/catalog')

    await page.locator('button').filter({ hasText: '⌁' }).click()
    await page.waitForURL('**/cart')
  })
})
