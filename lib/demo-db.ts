import { PGlite } from '@electric-sql/pglite'
import { schema } from './schema'
import { hashPassword } from './password'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const state = globalThis as typeof globalThis & { demoDatabase?: Promise<PGlite> }
export function getDemoDb() {
  if (process.env.VERCEL) throw new Error('Local demo storage is not supported on Vercel; configure DEMO_DATABASE_URL')
  state.demoDatabase ??= (async () => {
    const dataDir = path.resolve(/* turbopackIgnore: true */ process.env.DEMO_DATA_DIR || '.demo-data')
    await mkdir(dataDir, { recursive: true })
    const db = new PGlite(dataDir)
    await db.exec(schema)
    await db.query('INSERT INTO agents (email,password_hash,full_name) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING',
      ['agent@example.com', hashPassword('DemoAgent123!'), 'Demo Agent'])
    await db.query(`INSERT INTO customers (first_name,last_name,email,phone,address_line1,city,state,zip_code,
      subscription_plan,subscription_price,card_last_four,card_expiry,plan_sku)
      SELECT 'Alex','Demo','alex@example.com','2025550100','123 Demo Street','Chicago','IL','60601',
      'gadget_phone_plan',19.99,'4242','12/39','DPTotalProtect'
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'alex@example.com')`)
    return db
  })()
  return state.demoDatabase
}

