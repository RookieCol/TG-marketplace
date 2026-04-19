import {
  pgTable, pgEnum, uuid, text, numeric, boolean,
  timestamp, jsonb, serial, bigint,
} from 'drizzle-orm/pg-core'

export const productCategoryEnum = pgEnum('product_category', [
  'preroll', 'gummy', 'oil', 'other',
])

export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment', 'paid', 'accepted', 'on_the_way', 'delivered', 'rejected',
])

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  category: productCategoryEnum('category').notNull(),
  price_usd: numeric('price_usd', { precision: 10, scale: 2 }).notNull(),
  image_url: text('image_url').notNull().default(''),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_number: serial('order_number').unique(),
  telegram_user_id: bigint('telegram_user_id', { mode: 'number' }).notNull(),
  telegram_username: text('telegram_username').notNull().default(''),
  items: jsonb('items').notNull().$type<OrderItem[]>(),
  delivery_address: text('delivery_address').notNull(),
  delivery_note: text('delivery_note').notNull().default(''),
  subtotal_usd: numeric('subtotal_usd', { precision: 10, scale: 2 }).notNull(),
  delivery_fee_usd: numeric('delivery_fee_usd', { precision: 10, scale: 2 }).notNull(),
  total_usd: numeric('total_usd', { precision: 10, scale: 2 }).notNull(),
  ton_address: text('ton_address').notNull().default(''),
  ton_tx_hash: text('ton_tx_hash'),
  status: orderStatusEnum('status').notNull().default('pending_payment'),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export interface OrderItem {
  product_id: string
  name: string
  qty: number
  price: number
}
