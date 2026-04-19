'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { ProductSheet } from '@/components/product-sheet'
import { useCartStore } from '@/lib/cart'

interface Product {
  id: string; name: string; description: string; category: string;
  price_usd: string | number; image_url: string; active: boolean;
}

type Category = 'all' | 'preroll' | 'gummy' | 'oil' | 'other'

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pre-rolls', value: 'preroll' },
  { label: 'Gomitas', value: 'gummy' },
  { label: 'Aceites', value: 'oil' },
  { label: 'Otros', value: 'other' },
]

export default function CatalogPage() {
  const router = useRouter()
  const [all, setAll] = useState<Product[]>([])
  const [category, setCategory] = useState<Category>('all')
  const [sheet, setSheet] = useState<Product | null>(null)
  const itemCount = useCartStore((s) => s.itemCount())

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setAll).catch(() => setAll([]))
  }, [])

  const filtered = category === 'all' ? all : all.filter((p) => p.category === category)

  return (
    <div style={{ paddingBottom: 32, minHeight: '100svh', background: 'var(--bg)' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--text)' }}>
          TG Market
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => router.push('/cart')}
            style={{
              width: 32, height: 32,
              border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: 'var(--text)',
              borderRadius: 'var(--radius)',
              position: 'relative',
            }}
          >
            ⌁
            {itemCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14,
                background: 'var(--text)', color: 'var(--surface)',
                fontSize: 8, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 0,
              }}>{itemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav style={{
        display: 'flex', gap: 0,
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        overflowX: 'auto',
      }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            style={{
              fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 500,
              color: category === c.value ? 'var(--text)' : 'var(--text-3)',
              padding: '10px 12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: 'transparent',
              border: 'none',
              borderBottomStyle: 'solid',
              borderBottomWidth: 1.5,
              borderBottomColor: category === c.value ? 'var(--text)' : 'transparent',
              marginBottom: -1,
            }}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {/* Product grid: 1px gaps create editorial separators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        background: 'var(--border)',
      }}>
        {filtered.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => setSheet(p)}
          />
        ))}
      </div>

      {/* Bottom sheet overlay */}
      {sheet && <ProductSheet product={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}
