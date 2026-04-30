import { test, expect, mockProducts } from './fixtures'

test.describe('age gate', () => {
  test('shows on first visit and gates access to catalog', async ({ page }) => {
    await mockProducts(page)
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Verificación de edad' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Tengo 18 años o más/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Soy menor de edad/i })).toBeDisabled()
  })

  test('confirming age sets cookie and redirects to /catalog', async ({ page }) => {
    await mockProducts(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Tengo 18 años o más/i }).click()

    await page.waitForURL('**/catalog')
    await expect(page.getByText('TG Market')).toBeVisible()

    const cookies = await page.context().cookies()
    expect(cookies.find((c) => c.name === 'age_verified')?.value).toBe('1')
  })

  test('returning verified user is redirected past the gate', async ({ page, baseURL }) => {
    await mockProducts(page)
    await page.context().addCookies([
      { name: 'age_verified', value: '1', url: baseURL ?? 'http://localhost:3000' },
    ])

    await page.goto('/')
    await page.waitForURL('**/catalog')
    await expect(page.getByRole('heading', { name: 'Verificación de edad' })).toHaveCount(0)
  })
})
