'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AgeGate, useAgeVerified } from '@/components/age-gate'

export default function HomePage() {
  const router = useRouter()
  const { verified, confirm } = useAgeVerified()

  useEffect(() => {
    if (verified === true) router.replace('/catalog')
  }, [verified, router])

  const handleConfirm = () => {
    confirm()
    router.replace('/catalog')
  }

  if (verified === null) return null
  if (verified === true) return null
  return <AgeGate onConfirm={handleConfirm} />
}
