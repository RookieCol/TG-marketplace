'use client'
import { useEffect, useState } from 'react'

const FIELDS = [
  { key: 'delivery_fee', label: 'Costo delivery (USD)', type: 'number' },
  { key: 'estimated_time', label: 'Tiempo estimado (ej: 30-45)', type: 'text' },
  { key: 'ton_wallet_address', label: 'Dirección TON receptora', type: 'text' },
  { key: 'welcome_message', label: 'Mensaje de bienvenida', type: 'text' },
] as const

export default function AdminConfigPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/config').then((r) => r.json()).then(setValues)
  }, [])

  const handleSave = async () => {
    await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h1 className="text-white font-bold text-xl">Configuración</h1>
      {FIELDS.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <label className="text-[var(--text-muted)] text-xs">{f.label}</label>
          <input type={f.type} value={values[f.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className="bg-[var(--surface)] text-white rounded-[var(--radius)] p-3 text-sm outline-none" />
        </div>
      ))}
      <button onClick={handleSave} className="bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3">
        {saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}
