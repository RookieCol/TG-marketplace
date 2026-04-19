'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true); setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (!res || res.error) { setError('Credenciales incorrectas'); setLoading(false); return }
    router.push('/admin')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <span className="text-[var(--accent)] text-3xl font-bold">🌿 Admin</span>
      <div className="w-full max-w-sm flex flex-col gap-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-[var(--surface)] text-white rounded-[var(--radius)] p-3 outline-none" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="bg-[var(--surface)] text-white rounded-[var(--radius)] p-3 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={handleLogin} disabled={loading} className="bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3 disabled:opacity-50">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}
