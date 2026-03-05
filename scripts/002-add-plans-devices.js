import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  try {
    console.log('Starting migration: adding plans and devices tables...')

    // Add plan_type enum and subscription_status enum to customers table
    await sql`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'phone_plan',
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS subscription_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255),
      ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50),
      ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP
    `

    // Create devices table
    await sql`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        device_type VARCHAR(50) NOT NULL,
        device_name VARCHAR(255),
        imei VARCHAR(15),
        serial_number VARCHAR(255),
        brand VARCHAR(100),
        model VARCHAR(100),
        color VARCHAR(50),
        storage_capacity VARCHAR(50),
        condition VARCHAR(50),
        purchased_date DATE,
        value DECIMAL(10, 2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create index on customer_id for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_devices_customer_id 
      ON devices(customer_id)
    `

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
