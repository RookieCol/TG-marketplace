'use client'
import { useEffect, useState } from 'react'
import { ProductForm } from '@/components/admin/product-form'

export default function AdminProductsPage() {
  const [productsList, setProductsList] = useState<any[]>([])
  const [editing, setEditing] = useState<any | 'new' | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/products')
    if (res.ok) setProductsList(await res.json())
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (res.ok) load()
    } catch { /* network error */ }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Productos</h1>
        <button onClick={() => setEditing('new')} className="bg-[#c9f04a] text-[#000000] text-sm font-bold px-3 py-2 rounded-lg">+ Nuevo</button>
      </div>
      {editing && <ProductForm product={editing === 'new' ? undefined : editing} onSave={() => { setEditing(null); load() }} onCancel={() => setEditing(null)} />}
      <div className="flex flex-col gap-2">
        {productsList.map((p) => (
          <div key={p.id} className="bg-[#1a1a1a] rounded-[8px] p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{p.name}</p>
              <p className="text-[#888888] text-xs">{p.category} · ${Number(p.price_usd).toFixed(2)}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-[#c9f04a]/20 text-[#c9f04a]' : 'bg-red-400/10 text-red-400'}`}>{p.active ? 'Activo' : 'Inactivo'}</span>
            <button onClick={() => setEditing(p)} className="text-[#888888] text-xs hover:text-white">Editar</button>
            <button onClick={() => handleDelete(p.id)} className="text-red-400 text-xs">Borrar</button>
          </div>
        ))}
      </div>
    </div>
  )
}
