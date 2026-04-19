'use client'
import { useEffect, useState } from 'react'

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      gap: 20,
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: 8 }}>
        <p style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '.22em',
          textTransform: 'uppercase', color: 'var(--text)', marginBottom: 24,
        }}>
          TG Market
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: 'var(--text)', marginBottom: 12 }}>
          Verificación de edad
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 260 }}>
          Este sitio contiene productos de cannabis. Debes ser mayor de 18 años para continuar.
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        <button
          onClick={onConfirm}
          style={{
            width: '100%', height: 48,
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
          }}
        >
          Tengo 18 años o más
        </button>
        <button
          disabled
          style={{
            width: '100%', height: 48,
            background: 'transparent', color: 'var(--text-2)',
            border: '1px solid var(--border)',
            fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
          }}
        >
          Soy menor de edad
        </button>
      </div>

      <p style={{ fontSize: 9, color: 'var(--text-3)', lineHeight: 1.5, maxWidth: 240, marginTop: 8 }}>
        Al continuar aceptas nuestros términos de uso. El cannabis puede ser ilegal en tu jurisdicción. Verifica las leyes locales.
      </p>
    </div>
  )
}

export function useAgeVerified() {
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const has = document.cookie.split(';').some((c) => c.trim().startsWith('age_verified=1'))
    setVerified(has)
  }, [])

  const confirm = () => {
    document.cookie = 'age_verified=1; max-age=31536000; path=/'
    setVerified(true)
  }

  return { verified, confirm }
}
