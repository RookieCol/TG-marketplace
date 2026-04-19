'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart'

declare global { interface Window { Telegram?: { WebApp?: { initData: string } } } }

const DELIVERY_FEE = 3

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  borderRadius: 'var(--radius)',
  padding: '10px 12px',
  outline: 'none',
  border: '1px solid var(--border)',
  resize: 'none' as const,
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-3)',
  fontWeight: 500,
}

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
    try {
      const initData = window.Telegram?.WebApp?.initData ?? ''
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, items, delivery_address: address.trim(), delivery_note: note.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear pedido'); setLoading(false); return }
      clear()
      router.push(`/pay/${data.order.id}?uri=${encodeURIComponent(data.paymentUri)}&memo=${encodeURIComponent(data.memo)}`)
    } catch {
      setError('Error de red. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text)' }}>←</button>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text)' }}>
          Checkout
        </span>
      </div>

      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Address form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={labelStyle}>Dirección de entrega *</span>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Calle, número, barrio, ciudad..."
            rows={3}
            style={inputStyle}
          />
          <span style={labelStyle}>Nota al repartidor (opcional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Apto 201, timbre no funciona..."
            style={inputStyle}
          />
        </div>

        {/* Order summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={labelStyle}>Resumen</span>
          {items.map((i) => (
            <div key={i.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-2)' }}>{i.name} ×{i.qty}</span>
              <span style={{ color: 'var(--text)' }}>${(i.price * i.qty).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <span style={{ color: 'var(--text-2)' }}>Envío</span>
            <span style={{ color: 'var(--text)' }}>${DELIVERY_FEE.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span style={{ color: 'var(--accent-dark)' }}>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {error && <p style={{ color: '#e53935', fontSize: 12 }}>{error}</p>}
      </div>

      {/* Footer CTA */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', height: 46,
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {loading ? 'PROCESANDO...' : (
            <>CONFIRMAR PEDIDO · <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${grandTotal.toFixed(2)}</span></>
          )}
        </button>
      </div>
    </div>
  )
}
