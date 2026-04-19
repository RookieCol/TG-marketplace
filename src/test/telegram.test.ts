import { describe, it, expect } from 'vitest'
import { parseTelegramUser } from '@/lib/telegram'

describe('parseTelegramUser', () => {
  it('returns null for empty string', () => {
    expect(parseTelegramUser('')).toBeNull()
  })

  it('extracts user from valid initData', () => {
    const user = { id: 123, first_name: 'Juan', username: 'juanuser' }
    const initData = `user=${encodeURIComponent(JSON.stringify(user))}&hash=abc`
    const result = parseTelegramUser(initData)
    expect(result?.id).toBe(123)
    expect(result?.username).toBe('juanuser')
  })
})
