'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
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
]

export default function CatalogPage() {
  const router = useRouter()
  const [all, setAll] = useState<Product[]>([])
  const [category, setCategory] = useState<Category>('all')
  const itemCount = useCartStore((s) => s.itemCount())

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setAll)
  }, [])

  const filtered = category === 'all' ? all : all.filter((p) => p.category === category)

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* M3 Top App Bar */}
      {/* @ts-ignore */}
      <md-top-app-bar style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <span slot="headline" style={{ color: 'var(--md-sys-color-primary)', fontWeight: 700 }}>
          🌿 GreenStore
        </span>
        {/* @ts-ignore */}
        <md-icon-button
          slot="trailing-icon"
          onClick={() => router.push('/cart')}
          style={{ position: 'relative' }}
        >
          {/* @ts-ignore */}
          <md-icon>shopping_cart</md-icon>
          {itemCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              background: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              borderRadius: '50%', width: 16, height: 16,
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {itemCount}
            </span>
          )}
        {/* @ts-ignore */}
        </md-icon-button>
      {/* @ts-ignore */}
      </md-top-app-bar>

      {/* Category filter chips */}
      <div style={{ padding: '12px 16px 0' }}>
        {/* @ts-ignore */}
        <md-chip-set>
          {CATEGORIES.map((c) => (
            // @ts-ignore
            <md-filter-chip
              key={c.value}
              label={c.label}
              selected={category === c.value ? true : undefined}
              onClick={() => setCategory(c.value)}
            />
          ))}
        {/* @ts-ignore */}
        </md-chip-set>
      </div>

      {/* Product grid */}
      <div style={{
        padding: '12px 16px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {filtered.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => router.push(`/product/${p.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
