import 'dotenv/config'
import { Bot } from 'grammy'
import { db, orders } from '../src/lib/db'
import { eq } from 'drizzle-orm'
import { notifyClientAccepted, notifyClientRejected } from '../src/lib/bot'
import { getConfig } from '../src/lib/config'

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

bot.on('callback_query:data', async (ctx) => {
  const [action, orderId] = ctx.callbackQuery.data.split(':')
  if (!orderId) return ctx.answerCallbackQuery()

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return ctx.answerCallbackQuery()

  if (action === 'accept') {
    await db.update(orders).set({ status: 'accepted' }).where(eq(orders.id, orderId))
    const cfg = await getConfig()
    await notifyClientAccepted(order.telegram_user_id, order.order_number!, cfg.estimated_time)
    await ctx.answerCallbackQuery({ text: '✅ Pedido aceptado' })
  } else if (action === 'reject') {
    await db.update(orders).set({ status: 'rejected' }).where(eq(orders.id, orderId))
    await notifyClientRejected(order.telegram_user_id, order.order_number!)
    await ctx.answerCallbackQuery({ text: '❌ Pedido rechazado' })
  } else {
    await ctx.answerCallbackQuery()
  }
})

bot.catch((err) => console.error('Bot error:', err))
bot.start()
console.log('Bot running in long polling mode')
