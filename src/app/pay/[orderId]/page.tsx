'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import { CountdownTimer } from '@/components/countdown-timer'

function PayPageInner() {
  const { orderId } = useParams<{ orderId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tonAddress, setTonAddress] = useState('')
  const [expired, setExpired] = useState(false)
  const [expiresAt] = useState(() => new Date(Date.now() + 15 * 60 * 1000))
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const paymentUri = decodeURIComponent(searchParams.get('uri') ?? '')
  const memo = searchParams.get('memo') ? decodeURIComponent(searchParams.get('memo')!) : ''

  useEffect(() => {
    const match = paymentUri.match(/ton:\/\/transfer\/([^?]+)/)
    if (match) setTonAddress(match[1])
    if (canvasRef.current && paymentUri) QRCode.toCanvas(canvasRef.current, paymentUri, { width: 180, margin: 2 })
  }, [paymentUri])

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        const data = await res.json()
        if (data.status === 'paid') { clearInterval(pollingRef.current!); router.push(`/confirm/${orderId}`) }
      } catch { /* ignore network errors, keep polling */ }
    }, 5000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [orderId, router])

  const handleCopy = () => navigator.clipboard.writeText(tonAddress)

  return (
    <div className="px-4 py-4 flex flex-col items-center gap-5 min-h-screen">
      <div className="w-full flex items-center gap-2">
        <h1 className="text-white font-bold text-lg">Pago del pedido</h1>
        <span className="ml-auto text-sm">⏱ <CountdownTimer expiresAt={expiresAt} onExpire={() => setExpired(true)} /></span>
      </div>
      {expired ? (
        <div className="flex flex-col items-center gap-4 mt-8 text-center">
          <span className="text-4xl">⏰</span>
          <p className="text-[var(--text-muted)]">El tiempo de pago expiró</p>
          <button onClick={() => router.push('/catalog')} className="bg-[var(--accent)] text-[var(--accent-fg)] font-bold px-6 py-3 rounded-[var(--radius)]">Volver al catálogo</button>
        </div>
      ) : (
        <>
          <div className="bg-white p-3 rounded-xl"><canvas ref={canvasRef} /></div>
          <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 w-full text-center">
            <p className="text-[var(--accent)] text-xl font-bold">USDT · TON</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">Memo: <span className="text-white font-mono">{memo}</span></p>
          </div>
          <div className="bg-[var(--surface)] rounded-[var(--radius)] p-3 w-full">
            <p className="text-[var(--text-muted)] text-xs mb-1">Dirección</p>
            <p className="text-white font-mono text-xs break-all">{tonAddress}</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={handleCopy} className="flex-1 bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3 text-sm">Copiar dirección</button>
            <button onClick={() => window.open(paymentUri, '_blank')} className="flex-1 bg-[var(--surface)] text-[var(--accent)] border border-[var(--accent)] font-semibold rounded-[var(--radius)] py-3 text-sm">Abrir wallet</button>
          </div>
          <p className="text-[var(--text-muted)] text-xs text-center">Detectamos el pago automáticamente. No cierres esta pantalla.</p>
        </>
      )}
    </div>
  )
}

export default function PayPage() {
  return <Suspense><PayPageInner /></Suspense>
}
