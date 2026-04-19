'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart'

declare global { interface Window { Telegram?: { WebApp?: { initData: string } } } }

const DELIVERY_FEE = 3

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCartStore()
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const grandTotal = total() + DELIVERY_FEE

  const handleSubmit = async () => {
    if (address.trim().length < 10) { setError('Dirección muy corta (mínimo 10 caracteres)'); return }
    setLoading(true); setError('')
    const initData = window.Telegram?.WebApp?.initData ?? ''
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, items, delivery_address: address.trim(), delivery_note: note.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al crear pedido'); setLoading(false); return }
    clear()
    router.push(`/pay/${data.order.id}?uri=${encodeURIComponent(data.paymentUri)}&memo=${data.memo}`)
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4 min-h-screen">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-[var(--text-muted)] text-sm">←</button>
        <h1 className="text-white font-bold text-lg">Checkout</h1>
      </div>
      <div className="flex flex-col gap-3">
        <label className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Dirección de entrega *</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, número, barrio, ciudad..." rows={3} className="bg-[var(--surface)] text-white text-sm rounded-[var(--radius)] p-3 resize-none outline-none placeholder:text-[var(--text-muted)]" />
        <label className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Nota al repartidor (opcional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Apto 201, timbre no funciona..." className="bg-[var(--surface)] text-white text-sm rounded-[var(--radius)] p-3 outline-none placeholder:text-[var(--text-muted)]" />
      </div>
      <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 flex flex-col gap-1.5">
        {items.map((i) => (
          <div key={i.product_id} className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{i.name} ×{i.qty}</span>
            <span className="text-white">${(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2 mt-1">
          <span className="text-[var(--text-muted)]">Delivery</span>
          <span className="text-white">${DELIVERY_FEE.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-white">Total</span>
          <span className="text-[var(--accent)]">${grandTotal.toFixed(2)}</span>
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button onClick={handleSubmit} disabled={loading} className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3 disabled:opacity-50">
        {loading ? 'Procesando...' : `Confirmar pedido · $${grandTotal.toFixed(2)}`}
      </button>
    </div>
  )
}
