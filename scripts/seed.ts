import 'dotenv/config'
import { db, products, config, adminUsers } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function seed() {
  await db.insert(config).values([
    { key: 'delivery_fee', value: '3.00' },
    { key: 'estimated_time', value: '30-45' },
    { key: 'ton_wallet_address', value: '' },
    { key: 'welcome_message', value: 'Bienvenido a nuestra tienda' },
  ]).onConflictDoNothing()

  await db.insert(products).values([
    { name: 'Pre-roll OG Kush', description: 'Cepa clásica eufórica. THC 22%. Indica. 1g.', category: 'preroll', price_usd: '12.00', image_url: '' },
    { name: 'Pre-roll Blueberry', description: 'Sabor frutal, relajante. Indica. 1.5g.', category: 'preroll', price_usd: '15.00', image_url: '' },
    { name: 'Gomita CBD Fresa', description: '25mg CBD. Pack x10.', category: 'gummy', price_usd: '8.00', image_url: '' },
    { name: 'Aceite CBD 10%', description: 'Full Spectrum. 30ml.', category: 'oil', price_usd: '35.00', image_url: '' },
  ]).onConflictDoNothing()

  const hash = await bcrypt.hash('admin1234', 10)
  await db.insert(adminUsers).values({
    email: 'admin@greenstore.local',
    password_hash: hash,
  }).onConflictDoNothing()

  console.log('Seed complete')
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
