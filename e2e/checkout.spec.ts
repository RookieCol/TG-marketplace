import { test, expect, mockProducts, mockCreateOrder, sampleProducts } from './fixtures'

test.describe('checkout', () => {
  test.beforeEach(async ({ verifiedPage: page }) => {
    await mockProducts(page)
  })

  async function addItemAndOpenCheckout(page: import('@playwright/test').Page) {
    await page.goto('/catalog')
    await page.getByText(sampleProducts[0].name).locator('..').getByRole('button', { name: '+' }).click()
    await page.locator('button').filter({ hasText: '⌁' }).click()
    await page.waitForURL('**/cart')
    await page.getByRole('button', { name: /IR A PAGAR/i }).click()
    await page.waitForURL('**/checkout')
  }

  test('rejects a too-short delivery address', async ({ verifiedPage: page }) => {
    await addItemAndOpenCheckout(page)

    await page.getByPlaceholder('Calle, número, barrio, ciudad...').fill('corto')
    await page.getByRole('button', { name: /CONFIRMAR PEDIDO/i }).click()

    await expect(page.getByText(/Dirección muy corta/i)).toBeVisible()
    await expect(page).toHaveURL(/\/checkout$/)
  })

  test('submits a valid order and redirects to /pay/[id] with payment params', async ({
    verifiedPage: page,
  }) => {
    await addItemAndOpenCheckout(page)
    const { orderId, paymentUri, memo } = await mockCreateOrder(page, {
      orderId: 'abc-123',
      paymentUri: 'ton://transfer/UQBxyz?amount=12000000',
      memo: 'TGM-ABC',
    })

    const requestPromise = page.waitForRequest(
      (req) => req.url().endsWith('/api/orders') && req.method() === 'POST',
    )

    await page
      .getByPlaceholder('Calle, número, barrio, ciudad...')
      .fill('Calle 123 #45-67, Barrio Centro, Bogotá')
    await page.getByPlaceholder('Apto 201, timbre no funciona...').fill('Apto 802')
    await page.getByRole('button', { name: /CONFIRMAR PEDIDO/i }).click()

    const req = await requestPromise
    const body = req.postDataJSON()
    expect(body.delivery_address).toBe('Calle 123 #45-67, Barrio Centro, Bogotá')
    expect(body.delivery_note).toBe('Apto 802')
    expect(body.items).toHaveLength(1)
    expect(body.items[0].product_id).toBe(sampleProducts[0].id)

    await page.waitForURL((url) => url.pathname === `/pay/${orderId}`)
    expect(page.url()).toContain(`uri=${encodeURIComponent(paymentUri)}`)
    expect(page.url()).toContain(`memo=${encodeURIComponent(memo)}`)
  })

  test('surfaces a server-side error message', async ({ verifiedPage: page }) => {
    await addItemAndOpenCheckout(page)
    await page.route('**/api/orders', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Producto no disponible' }),
      })
    })

    await page
      .getByPlaceholder('Calle, número, barrio, ciudad...')
      .fill('Calle 123 #45-67, Barrio Centro, Bogotá')
    await page.getByRole('button', { name: /CONFIRMAR PEDIDO/i }).click()

    await expect(page.getByText('Producto no disponible')).toBeVisible()
    await expect(page).toHaveURL(/\/checkout$/)
  })
})
