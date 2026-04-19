'use client'
import { useCartStore, type CartItem } from '@/lib/cart'

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQty } = useCartStore()
  return (
    <div className="flex items-center gap-3 bg-[var(--surface)] rounded-[var(--radius)] p-3">
      <span className="text-2xl">🛍️</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{item.name}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => updateQty(item.product_id, item.qty - 1)} className="text-[var(--text-muted)] w-6 h-6 bg-[var(--surface-2)] rounded text-sm">−</button>
        <span className="text-white text-sm w-4 text-center">{item.qty}</span>
        <button onClick={() => updateQty(item.product_id, item.qty + 1)} className="text-[var(--accent)] w-6 h-6 bg-[var(--surface-2)] rounded text-sm font-bold">+</button>
      </div>
      <span className="text-[var(--accent)] text-sm font-bold w-16 text-right">${(item.price * item.qty).toFixed(2)}</span>
    </div>
  )
}
