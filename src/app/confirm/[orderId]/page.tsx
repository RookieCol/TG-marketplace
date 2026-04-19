'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/orders/${orderId}/status`).then((r) => r.json()).then((d) => setOrder(d.order))
  }, [orderId])

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text)' }}>
          Confirmación
        </span>
      </div>

      <div style={{ flex: 1, padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56,
          border: '2px solid var(--text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>✓</div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>¡Pago recibido!</h1>

        {order && (
          <>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              padding: '14px 16px', width: '100%', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <span style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Pedido #{order.order_number}
              </span>
              {(order.items as any[]).map((item: any) => (
                <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>{item.name} ×{item.qty}</span>
                  <span style={{ color: 'var(--text)' }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                <span style={{ color: 'var(--text)' }}>Total</span>
                <span style={{ color: 'var(--accent-dark)' }}>${Number(order.total_usd).toFixed(2)} USDT</span>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
              Tu pedido llegará en aproximadamente<br />
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>30–45 minutos</span>
            </p>

            {order.ton_tx_hash && (
              <p style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                Tx: {order.ton_tx_hash.slice(0, 24)}...
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => router.push('/catalog')}
          style={{
            width: '100%', height: 46,
            background: 'transparent', color: 'var(--text)',
            border: '1px solid var(--border-strong)', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
          }}
        >
          SEGUIR COMPRANDO
        </button>
      </div>
    </div>
  )
}
