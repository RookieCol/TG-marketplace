import { Bot, InlineKeyboard } from 'grammy'
import type { InferSelectModel } from 'drizzle-orm'
import type { orders } from './db/schema'

type Order = InferSelectModel<typeof orders>

let _bot: Bot | null = null

export function getBot(): Bot {
  if (!_bot) _bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)
  return _bot
}

export async function notifyAdminNewOrder(order: Order): Promise<void> {
  const bot = getBot()
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const items = order.items as Array<{ name: string; qty: number; price: number }>
  const itemLines = items
    .map((i) => `• ${i.name} ×${i.qty} — $${(i.price * i.qty).toFixed(2)}`)
    .join('\n')

  const text =
    `🛒 *Nuevo pedido #${order.order_number}*\n\n` +
    `👤 @${order.telegram_username || order.telegram_user_id}\n` +
    `📍 ${order.delivery_address}\n` +
    (order.delivery_note ? `📝 ${order.delivery_note}\n` : '') +
    `\n─────────────\n${itemLines}\n` +
    `🚚 Delivery — $${Number(order.delivery_fee_usd).toFixed(2)}\n` +
    `─────────────\n` +
    `💰 *Total: $${Number(order.total_usd).toFixed(2)} USDT*\n` +
    `✅ Pago confirmado · \`${order.ton_tx_hash?.slice(0, 12)}...\``

  const keyboard = new InlineKeyboard()
    .text('✅ Aceptar', `accept:${order.id}`)
    .text('❌ Rechazar', `reject:${order.id}`)
    .row()
    .url('📋 Ver en CMS', `${appUrl}/admin/orders`)

  await bot.api.sendMessage(adminChatId, text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  })
}

export async function notifyClientAccepted(
  telegramUserId: number,
  orderNumber: number,
  estimatedTime: string,
): Promise<void> {
  const bot = getBot()
  await bot.api.sendMessage(
    telegramUserId,
    `✅ Tu pedido #${orderNumber} fue *aceptado*.\n🚚 Llega en *${estimatedTime} minutos*`,
    { parse_mode: 'Markdown' },
  )
}

export async function notifyClientRejected(
  telegramUserId: number,
  orderNumber: number,
): Promise<void> {
  const bot = getBot()
  await bot.api.sendMessage(
    telegramUserId,
    `❌ Tu pedido #${orderNumber} fue rechazado. Contáctanos para más info.`,
  )
}
