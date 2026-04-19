'use client'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart'
import { CartItemRow } from '@/components/cart-item'

const DELIVERY_FEE = 3

export default function CartPage() {
  const router = useRouter()
  const { items, total } = useCartStore()

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <span className="text-5xl">🛒</span>
      <p className="text-[var(--text-muted)]">Tu carrito está vacío</p>
      <button onClick={() => router.push('/catalog')} className="bg-[var(--accent)] text-[var(--accent-fg)] font-bold px-6 py-3 rounded-[var(--radius)]">
        Ver catálogo
      </button>
    </div>
  )

  const subtotal = total()
  const grandTotal = subtotal + DELIVERY_FEE

  return (
    <div className="px-4 py-4 flex flex-col gap-4 min-h-screen">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-[var(--text-muted)] text-sm">←</button>
        <h1 className="text-white font-bold text-lg">Mi carrito 🛒</h1>
      </div>
      <div className="flex flex-col gap-2">{items.map((i) => <CartItemRow key={i.product_id} item={i} />)}</div>
      <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2 mt-auto">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <span className="text-white">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Delivery</span>
          <span className="text-[var(--accent)]">${DELIVERY_FEE.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-white">Total</span>
          <span className="text-[var(--accent)] text-lg">${grandTotal.toFixed(2)}</span>
        </div>
      </div>
      <button onClick={() => router.push('/checkout')} className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3">
        Ir a pagar →
      </button>
    </div>
  )
}
