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
    <div className="px-4 py-4 flex flex-col items-center gap-6 min-h-screen text-center">
      <div className="w-16 h-16 bg-[var(--accent)] bg-opacity-20 rounded-full flex items-center justify-center text-4xl mt-8">✅</div>
      <h1 className="text-white text-2xl font-bold">¡Pago recibido!</h1>
      {order && (
        <>
          <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 w-full text-left flex flex-col gap-2">
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Pedido #{order.order_number}</p>
            {(order.items as any[]).map((item: any) => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-white">{item.name} ×{item.qty}</span>
                <span className="text-[var(--accent)]">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-[var(--border)] pt-2 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-[var(--accent)]">${Number(order.total_usd).toFixed(2)} USDT</span>
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-sm">Tu pedido llegará en aproximadamente<br/><span className="text-[var(--accent)] font-bold">30–45 minutos</span></p>
          {order.ton_tx_hash && <p className="text-[var(--text-muted)] text-xs font-mono">Tx: {order.ton_tx_hash.slice(0, 20)}...</p>}
        </>
      )}
      <button onClick={() => router.push('/catalog')} className="w-full bg-[var(--surface)] text-[var(--accent)] border border-[var(--accent)] font-bold rounded-[var(--radius)] py-3 mt-auto">Seguir comprando</button>
    </div>
  )
}
