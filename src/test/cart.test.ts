import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/lib/cart'

const mockProduct = {
  id: 'p1',
  name: 'Pre-roll OG',
  description: '',
  category: 'preroll' as const,
  price_usd: '12.00',
  image_url: '',
  active: true,
  created_at: new Date(),
}

beforeEach(() => useCartStore.setState({ items: [] }))

describe('cart store', () => {
  it('adds a product', () => {
    useCartStore.getState().addItem(mockProduct)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].qty).toBe(1)
  })

  it('increments qty when adding same product', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct)
    expect(useCartStore.getState().items[0].qty).toBe(2)
  })

  it('removes an item', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().removeItem('p1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('computes total correctly', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct)
    expect(useCartStore.getState().total()).toBe(24)
  })
})
