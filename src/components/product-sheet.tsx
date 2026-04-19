'use client'
import { useState } from 'react'
import { useCartStore, type Product } from '@/lib/cart'

const EMOJI: Record<string, string> = {
  preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦',
}

interface Props {
  product: Product
  onClose: () => void
}

export function ProductSheet({ product, onClose }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)
  const price = Number(product.price_usd)
  const total = (price * qty).toFixed(2)

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.35)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-strong)',
          height: '72%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '4px 4px 0 0',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 32, height: 2, background: 'var(--border-strong)', margin: '10px auto', flexShrink: 0 }} />

        {/* Product image */}
        <div style={{
          width: '100%', height: 180,
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 64, flexShrink: 0,
          borderBottom: '1px solid var(--border)',
        }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : EMOJI[product.category as string] ?? '📦'}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {product.category}
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' }}>
            {product.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {product.description}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-dark)' }}>
            ${price.toFixed(2)}
          </span>

          {/* Qty selector */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-strong)', width: 'fit-content' }}>
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, fontWeight: 300, color: 'var(--text)' }}
            >−</button>
            <span style={{
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              borderLeft: '1px solid var(--border-strong)', borderRight: '1px solid var(--border-strong)',
            }}>{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, fontWeight: 300, color: 'var(--text)' }}
            >+</button>
          </div>
        </div>

        {/* Pinned CTA footer */}
        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <button
            onClick={handleAdd}
            style={{
              width: '100%', height: 46,
              background: 'var(--text)', color: 'var(--surface)',
              border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
              borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            AÑADIR AL CARRITO ·{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${total}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
