'use client'

type OrderStatus = 'pending_payment'|'paid'|'accepted'|'on_the_way'|'delivered'|'rejected'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Pago pendiente', paid: 'Pagado', accepted: 'Aceptado',
  on_the_way: 'En camino', delivered: 'Entregado', rejected: 'Rechazado',
}
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10',
  paid: 'text-[var(--accent)] bg-[var(--accent)]/10',
  accepted: 'text-blue-400 bg-blue-400/10',
  on_the_way: 'text-purple-400 bg-purple-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
}
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'accepted', accepted: 'on_the_way', on_the_way: 'delivered',
}

interface Order {
  id: string; order_number: number; telegram_username: string; telegram_user_id: number;
  delivery_address: string; items: any[]; total_usd: string | number; status: OrderStatus;
}

export function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const handleStatus = async (status: OrderStatus) => {
    await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
  }
  const nextStatus = NEXT[order.status]

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-white font-bold">#{order.order_number}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
      </div>
      <div className="text-[var(--text-muted)] text-xs">
        <p>👤 @{order.telegram_username || order.telegram_user_id}</p>
        <p>📍 {order.delivery_address}</p>
      </div>
      <div className="flex flex-col gap-1">
        {order.items.map((i: any) => (
          <div key={i.product_id} className="flex justify-between text-xs">
            <span className="text-white">{i.name} ×{i.qty}</span>
            <span className="text-[var(--accent)]">${(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-[var(--border)] pt-1 flex justify-between text-sm font-bold">
          <span className="text-white">Total</span>
          <span className="text-[var(--accent)]">${Number(order.total_usd).toFixed(2)} USDT</span>
        </div>
      </div>
      {nextStatus && (
        <button onClick={() => handleStatus(nextStatus)} className="bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-bold rounded-lg py-2">
          Marcar: {STATUS_LABEL[nextStatus]}
        </button>
      )}
    </div>
  )
}
