'use client'
import { useEffect } from 'react'

export function MaterialProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('@material/web/all.js')
  }, [])
  return <>{children}</>
}
