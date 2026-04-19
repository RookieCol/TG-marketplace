'use client'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart'
import { CartItemRow } from '@/components/cart-item'

const DELIVERY_FEE = 3

export default function CartPage() {
  const router = useRouter()
  const { items, total } = useCartStore()

  if (items.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100svh', gap: 16, padding: '0 24px', textAlign: 'center',
    }}>
      <span style={{ fontSize: 48 }}>🛒</span>
      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Tu carrito está vacío</p>
      <button
        onClick={() => router.push('/catalog')}
        style={{
          background: 'var(--text)', color: 'var(--surface)',
          border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
          padding: '12px 24px', borderRadius: 'var(--radius)',
        }}
      >
        Ver catálogo
      </button>
    </div>
  )

  const subtotal = total()
  const grandTotal = subtotal + DELIVERY_FEE

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text)' }}>←</button>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text)' }}>
          Tu pedido
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{items.length} productos</span>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
        {items.map((i) => <CartItemRow key={i.product_id} item={i} />)}
      </div>

      {/* Summary */}
      <div style={{ background: 'var(--surface)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)' }}>
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)' }}>
          <span>Envío</span><span>${DELIVERY_FEE.toFixed(2)}</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 14, fontWeight: 700,
          borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4,
        }}>
          <span style={{ color: 'var(--text)' }}>Total</span>
          <span style={{ color: 'var(--accent-dark)' }}>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer CTA */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => router.push('/checkout')}
          style={{
            width: '100%', height: 46,
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          IR A PAGAR ·{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${grandTotal.toFixed(2)}</span>
        </button>
      </div>
    </div>
  )
}
