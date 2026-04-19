import { describe, it, expect } from 'vitest'
import { buildTonPaymentUri, parseTonAmount } from '@/lib/ton'

describe('buildTonPaymentUri', () => {
  it('builds valid ton:// URI with memo and jetton', () => {
    const uri = buildTonPaymentUri('UQB3xkf9mP2k', 31.00, 'ORD-0042')
    expect(uri).toContain('ton://transfer/UQB3xkf9mP2k')
    expect(uri).toContain('text=ORD-0042')
    expect(uri).toContain('jetton=')
  })
})

describe('parseTonAmount', () => {
  it('converts nano-USDT (6 decimals) to decimal USD', () => {
    expect(parseTonAmount('31000000')).toBe(31)
  })

  it('handles partial amounts', () => {
    expect(parseTonAmount('5500000')).toBe(5.5)
  })
})
