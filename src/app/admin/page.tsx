'use client'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ todayOrders: 0, todaySales: 0, active: 0 })

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setStats(await res.json())
    }
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  const items = [
    { label: 'Pedidos hoy', value: stats.todayOrders },
    { label: 'Ventas hoy', value: `$${stats.todaySales.toFixed(0)}` },
    { label: 'En curso', value: stats.active },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-white font-bold text-xl">Dashboard</h1>
      <div className="grid grid-cols-3 gap-3">
        {items.map((s) => (
          <div key={s.label} className="bg-[#1a1a1a] rounded-[8px] p-4 text-center">
            <p className="text-[#c9f04a] text-2xl font-bold">{s.value}</p>
            <p className="text-[#888888] text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
