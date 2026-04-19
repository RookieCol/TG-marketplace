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
    if (canvasRef.current && paymentUri) {
      QRCode.toCanvas(canvasRef.current, paymentUri, {
        width: 180, margin: 2,
        color: { dark: '#0d0d0d', light: '#ffffff' },
      })
    }
  }, [paymentUri])

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        const data = await res.json()
        if (data.status === 'paid') { clearInterval(pollingRef.current!); router.push(`/confirm/${orderId}`) }
      } catch { /* keep polling */ }
    }, 5000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [orderId, router])

  const handleCopy = () => navigator.clipboard.writeText(tonAddress)

  if (expired) return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, textAlign: 'center', padding: '0 24px',
    }}>
      <span style={{ fontSize: 40 }}>⏰</span>
      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>El tiempo de pago expiró</p>
      <button
        onClick={() => router.push('/catalog')}
        style={{
          background: 'var(--text)', color: 'var(--surface)',
          border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
          padding: '12px 24px', borderRadius: 'var(--radius)',
        }}
      >Volver al catálogo</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text)' }}>
          Pago USDT
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          <CountdownTimer expiresAt={expiresAt} onExpire={() => setExpired(true)} />
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <p style={{ fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
            Total a pagar
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-dark)', lineHeight: 1 }}>
            USDT · TON
          </p>
          {memo && (
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Memo: <span style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>{memo}</span>
            </p>
          )}
        </div>

        {/* QR */}
        <div style={{
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 8,
        }}>
          <canvas ref={canvasRef} />
        </div>

        {/* Wallet address */}
        {tonAddress && (
          <div style={{
            width: '100%', background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '10px 12px',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span style={{
              flex: 1, fontSize: 10, fontFamily: 'monospace',
              color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{tonAddress}</span>
            <button
              onClick={handleCopy}
              style={{
                fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600,
                color: 'var(--text)', background: 'transparent',
                border: '1px solid var(--border-strong)', padding: '4px 8px', cursor: 'pointer',
                borderRadius: 'var(--radius)',
              }}
            >Copiar</button>
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
          Detectamos el pago automáticamente. No cierres esta pantalla.
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => window.open(paymentUri, '_blank')}
          style={{
            width: '100%', height: 46,
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
          }}
        >
          ABRIR WALLET
        </button>
      </div>
    </div>
  )
}

export default function PayPage() {
  return <Suspense><PayPageInner /></Suspense>
}
