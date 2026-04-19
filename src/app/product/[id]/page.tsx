'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { InferSelectModel } from 'drizzle-orm'
import type { products } from '@/lib/db/schema'
import { useCartStore } from '@/lib/cart'

type Product = InferSelectModel<typeof products>
const EMOJI: Record<string, string> = { preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦' }

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((ps: Product[]) => setProduct(ps.find((p) => p.id === id) ?? null))
  }, [id])

  if (!product) return (
    <div className="flex items-center justify-center min-h-screen text-[var(--text-muted)]">Cargando...</div>
  )

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product)
    router.back()
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4 min-h-screen">
      <button onClick={() => router.back()} className="text-[var(--text-muted)] text-sm self-start">← Volver</button>
      <div className="bg-[var(--surface)] rounded-xl h-44 flex items-center justify-center text-7xl">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover rounded-xl" />
          : EMOJI[product.category]}
      </div>
      <h1 className="text-white text-xl font-bold">{product.name}</h1>
      <div className="flex gap-2">
        <span className="bg-[var(--surface)] text-[var(--text-muted)] text-xs px-3 py-1 rounded-full">{product.category}</span>
      </div>
      <p className="text-[var(--text-muted)] text-sm leading-relaxed">{product.description}</p>
      <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
        <span className="text-[var(--accent)] text-2xl font-bold">${Number(product.price_usd).toFixed(2)}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="bg-[var(--surface)] text-white w-8 h-8 rounded-lg text-lg font-bold">−</button>
          <span className="text-white w-4 text-center">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="bg-[var(--accent)] text-[var(--accent-fg)] w-8 h-8 rounded-lg text-lg font-bold">+</button>
        </div>
      </div>
      <button onClick={handleAdd} className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3">
        Agregar al carrito 🛒
      </button>
    </div>
  )
}
