import { db, config } from './db'

export interface AppConfig {
  delivery_fee: string
  estimated_time: string
  ton_wallet_address: string
  welcome_message: string
}

export async function getConfig(): Promise<AppConfig> {
  const rows = await db.select().from(config)
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value
  return {
    delivery_fee: map.delivery_fee ?? '3.00',
    estimated_time: map.estimated_time ?? '30-45',
    ton_wallet_address: map.ton_wallet_address ?? process.env.TON_WALLET_ADDRESS ?? '',
    welcome_message: map.welcome_message ?? 'Bienvenido',
  }
}
