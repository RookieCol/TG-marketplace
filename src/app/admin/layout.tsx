'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut, SessionProvider } from 'next-auth/react'

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/orders', label: '🛒 Pedidos' },
  { href: '/admin/products', label: '📦 Productos' },
  { href: '/admin/config', label: '⚙️ Config' },
]

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.replace('/admin/login')
    }
  }, [status, pathname, router])

  if (pathname === '/admin/login') return <>{children}</>
  if (status === 'loading' || !session) return null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <span className="text-[#c9f04a] font-bold">🌿 GreenStore CMS</span>
        <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="text-[#888888] text-sm">Salir</button>
      </header>
      <div className="flex flex-1">
        <nav className="bg-[#1a1a1a] w-40 p-3 flex flex-col gap-1 border-r border-[#2a2a2a] shrink-0">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`text-xs px-3 py-2 rounded-lg transition-colors ${pathname === n.href ? 'bg-[#c9f04a] text-[#000000] font-bold' : 'text-[#888888] hover:text-white'}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider><AdminShell>{children}</AdminShell></SessionProvider>
}
