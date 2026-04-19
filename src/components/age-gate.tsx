'use client'
import { useEffect, useState } from 'react'

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6 text-center">
      <div style={{ fontSize: 64 }}>🌿</div>
      <h1 style={{ color: 'var(--md-sys-color-on-background)', fontSize: 24, fontWeight: 700, margin: 0 }}>
        Bienvenido
      </h1>
      <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
        Este sitio contiene productos para adultos mayores de 18 años.
      </p>
      {/* @ts-ignore */}
      <md-filled-button style={{ width: '100%' }} onClick={onConfirm}>
        Soy mayor de 18 ✓
      {/* @ts-ignore */}
      </md-filled-button>
      <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 12, margin: 0 }}>
        Al continuar aceptas nuestros términos
      </p>
    </div>
  )
}

export function useAgeVerified() {
  const [verified, setVerified] = useState<boolean | null>(null)
  useEffect(() => {
    setVerified(localStorage.getItem('age_verified') === 'true')
  }, [])
  const confirm = () => {
    localStorage.setItem('age_verified', 'true')
    setVerified(true)
  }
  return { verified, confirm }
}
