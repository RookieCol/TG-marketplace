'use client'
import { useEffect, useState } from 'react'
import { OrderCard } from '@/components/admin/order-card'

export default function AdminOrdersPage() {
  const [ordersList, setOrdersList] = useState<any[]>([])

  const load = async () => {
    const res = await fetch('/api/admin/orders')
    if (res.ok) setOrdersList(await res.json())
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-white font-bold text-xl">Pedidos</h1>
      {ordersList.length === 0
        ? <p className="text-[var(--text-muted)]">No hay pedidos aún.</p>
        : ordersList.map((o) => <OrderCard key={o.id} order={o} onUpdate={load} />)
      }
    </div>
  )
}
