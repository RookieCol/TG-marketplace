import { test as base, expect, type Page } from '@playwright/test'

export type Product = {
  id: string
  name: string
  description: string
  category: 'preroll' | 'gummy' | 'oil' | 'other'
  price_usd: string
  image_url: string
  active: boolean
}

export const sampleProducts: Product[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Pre-roll Lemon Haze',
    description: 'Pre-roll sativa de lemon haze.',
    category: 'preroll',
    price_usd: '12.00',
    image_url: '',
    active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Gomitas Indica 10mg',
    description: 'Gomitas con 10mg de THC.',
    category: 'gummy',
    price_usd: '20.00',
    image_url: '',
    active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Aceite CBD Full Spectrum',
    description: 'Aceite CBD 1000mg.',
    category: 'oil',
    price_usd: '45.00',
    image_url: '',
    active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Encendedor recargable',
    description: 'Accesorio.',
    category: 'other',
    price_usd: '8.00',
    image_url: '',
    active: true,
  },
]

export async function mockProducts(page: Page, products: Product[] = sampleProducts) {
  await page.route('**/api/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(products),
    })
  })
}

export async function mockCreateOrder(
  page: Page,
  options: { orderId?: string; paymentUri?: string; memo?: string } = {},
) {
  const orderId = options.orderId ?? 'order-test-1'
  const paymentUri = options.paymentUri ?? 'ton://transfer/UQB_test?amount=1'
  const memo = options.memo ?? 'TGM-TEST'
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        order: { id: orderId },
        paymentUri,
        memo,
      }),
    })
  })
  return { orderId, paymentUri, memo }
}

export async function setAgeVerified(page: Page) {
  await page.context().addCookies([
    {
      name: 'age_verified',
      value: '1',
      url: page.url() === 'about:blank' ? 'http://localhost:3000' : page.url(),
    },
  ])
}

export async function clearCart(page: Page) {
  await page.evaluate(() => {
    try {
      window.localStorage.removeItem('tg-cart')
    } catch {}
  })
}

export const test = base.extend<{ verifiedPage: Page }>({
  verifiedPage: async ({ page, baseURL }, use) => {
    await page.context().addCookies([
      {
        name: 'age_verified',
        value: '1',
        url: baseURL ?? 'http://localhost:3000',
      },
    ])
    await use(page)
  },
})

export { expect }
