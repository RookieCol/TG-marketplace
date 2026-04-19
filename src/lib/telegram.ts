import { createHmac } from 'crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

export function parseTelegramUser(initData: string): TelegramUser | null {
  if (!initData) return null
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    if (!userStr) return null
    return JSON.parse(decodeURIComponent(userStr)) as TelegramUser
  } catch {
    return null
  }
}

export function validateInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) return false
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false
    params.delete('hash')
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
    const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    return computed === hash
  } catch {
    return false
  }
}
