import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  // Create agents table for authentication
  await sql`
    CREATE TABLE IF NOT EXISTS agents (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log('Created agents table');

  // Create customers table for enrollment
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255) DEFAULT '',
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      zip_code VARCHAR(20) NOT NULL,
      country VARCHAR(100) DEFAULT 'United States',
      subscription_plan VARCHAR(50) NOT NULL,
      card_last_four VARCHAR(4) NOT NULL,
      card_expiry VARCHAR(7) NOT NULL,
      payment_status VARCHAR(20) NOT NULL DEFAULT 'active',
      enrolled_by_agent_id INTEGER REFERENCES agents(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log('Created customers table');

  // Create indexes for customer search
  await sql`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(last_name, first_name)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`;
  console.log('Created indexes');

  console.log('Migration complete!');
}

migrate().catch(console.error);
