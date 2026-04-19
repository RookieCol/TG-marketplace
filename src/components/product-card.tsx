'use client'
import { useCartStore } from '@/lib/cart'

const EMOJI: Record<string, string> = {
  preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦',
}

interface Product {
  id: string
  name: string
  description: string
  category: string
  price_usd: string | number
  image_url: string
  active: boolean
}

export function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--md-sys-color-surface-container)',
        borderRadius: 12,
        padding: 12,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          background: 'var(--md-sys-color-surface-container-high)',
          borderRadius: 8,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
        }}
      >
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ height: '100%', width: '100%', objectFit: 'cover', borderRadius: 8 }} />
          : EMOJI[product.category] ?? '📦'}
      </div>
      <div style={{ color: 'var(--md-sys-color-on-surface)', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
        {product.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--md-sys-color-primary)', fontSize: 14, fontWeight: 700 }}>
          ${Number(product.price_usd).toFixed(2)}
        </span>
        {/* @ts-ignore */}
        <md-icon-button
          onClick={(e: Event) => { e.stopPropagation(); addItem(product as any) }}
          style={{ '--md-icon-button-icon-color': 'var(--md-sys-color-primary)' } as React.CSSProperties}
        >
          {/* @ts-ignore */}
          <md-icon>add</md-icon>
        {/* @ts-ignore */}
        </md-icon-button>
      </div>
    </div>
  )
}
