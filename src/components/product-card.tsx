'use client'
import { useCartStore } from '@/lib/cart'

const EMOJI: Record<string, string> = {
  preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦',
}

interface Product {
  id: string; name: string; description: string; category: string;
  price_usd: string | number; image_url: string; active: boolean;
}

export function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '1/1',
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 42,
        borderBottom: '1px solid var(--border)',
      }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : EMOJI[product.category] ?? '📦'}
      </div>

      {/* Body */}
      <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          {product.category}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: 'var(--text)' }}>
          {product.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-dark)' }}>
            ${Number(product.price_usd).toFixed(2)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); addItem(product as any) }}
            style={{
              width: 26, height: 26,
              background: 'var(--text)', color: 'var(--surface)',
              border: 'none', cursor: 'pointer',
              fontSize: 16, fontWeight: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius)',
              lineHeight: 1,
            }}
          >+</button>
        </div>
      </div>
    </div>
  )
}
