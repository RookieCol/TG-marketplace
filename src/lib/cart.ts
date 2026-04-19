import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  product_id: string
  name: string
  price: number
  image_url: string
  qty: number
}

export interface Product {
  id: string
  name: string
  description?: string
  category?: string
  price_usd: string | number
  image_url: string
  active?: boolean
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clear: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.product_id === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i,
              ),
            }
          }
          return {
            items: [...state.items, {
              product_id: product.id,
              name: product.name,
              price: parseFloat(product.price_usd as string),
              image_url: product.image_url,
              qty: 1,
            }],
          }
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product_id !== productId) })),
      updateQty: (productId, qty) =>
        set((state) => ({
          items: qty <= 0
            ? state.items.filter((i) => i.product_id !== productId)
            : state.items.map((i) => i.product_id === productId ? { ...i, qty } : i),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: 'tg-cart' },
  ),
)
