'use client'
import { useCartStore, type CartItem } from '@/lib/cart'

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQty } = useCartStore()

  return (
    <div style={{
      background: 'var(--surface)',
      padding: '12px 16px',
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        🛍️
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
          ${item.price.toFixed(2)} c/u
        </p>
      </div>

      {/* Right: price + qty */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-dark)' }}>
          ${(item.price * item.qty).toFixed(2)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-strong)' }}>
          <button
            onClick={() => updateQty(item.product_id, item.qty - 1)}
            style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >−</button>
          <span style={{
            width: 24, height: 24, fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderLeft: '1px solid var(--border-strong)', borderRight: '1px solid var(--border-strong)',
          }}>{item.qty}</span>
          <button
            onClick={() => updateQty(item.product_id, item.qty + 1)}
            style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >+</button>
        </div>
      </div>
    </div>
  )
}
