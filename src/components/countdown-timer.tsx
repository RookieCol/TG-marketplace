'use client'
import { useEffect, useState } from 'react'

export function CountdownTimer({ expiresAt, onExpire }: { expiresAt: Date; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      setRemaining(diff)
      if (diff === 0) onExpire()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire])
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secs = (remaining % 60).toString().padStart(2, '0')
  return <span style={{ color: remaining < 60 ? '#e53935' : 'var(--text-3)' }}>{mins}:{secs}</span>
}
