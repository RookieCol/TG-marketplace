'use client'
import { useState } from 'react'

type Category = 'preroll' | 'gummy' | 'oil' | 'other'
const CATS: Category[] = ['preroll', 'gummy', 'oil', 'other']

interface Product { id?: string; name: string; description: string; category: Category; price_usd: string | number; image_url: string; active: boolean }

export function ProductForm({ product, onSave, onCancel }: { product?: Product; onSave: () => void; onCancel: () => void }) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category, setCategory] = useState<Category>(product?.category ?? 'preroll')
  const [price, setPrice] = useState(product?.price_usd?.toString() ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [active, setActive] = useState(product?.active ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !price) return
    setSaving(true)
    try {
      const payload = { name, description, category, price_usd: parseFloat(price), image_url: imageUrl, active }
      const res = await fetch(product?.id ? `/api/admin/products/${product.id}` : '/api/admin/products', {
        method: product?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) onSave()
    } catch { /* network error */ } finally {
      setSaving(false)
    }
  }

  const ic = 'bg-[var(--surface-2)] text-white rounded-lg p-2.5 text-sm outline-none w-full'
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 flex flex-col gap-3">
      <h3 className="text-white font-bold">{product?.id ? 'Editar' : 'Nuevo'} producto</h3>
      <input className={ic} placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea className={ic} placeholder="Descripción" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <select className={ic} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
        {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input className={ic} placeholder="Precio USD" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input className={ic} placeholder="URL imagen (opcional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo
      </label>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="flex-1 bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-lg py-2 text-sm disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
        <button onClick={onCancel} className="flex-1 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-lg py-2 text-sm">Cancelar</button>
      </div>
    </div>
  )
}
