// Idempotent schema shared by local demo initialization and explicit Neon migrations.
export const schema = `
CREATE TABLE IF NOT EXISTS agents (
 id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL,
 password_hash VARCHAR(255) NOT NULL, full_name VARCHAR(255) NOT NULL,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS customers (
 id SERIAL PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
 email VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL,
 address_line1 VARCHAR(255) NOT NULL, address_line2 VARCHAR(255) DEFAULT '',
 city VARCHAR(100) NOT NULL, state VARCHAR(100) NOT NULL, zip_code VARCHAR(20) NOT NULL,
 country VARCHAR(100) DEFAULT 'United States', subscription_plan VARCHAR(50) NOT NULL,
 card_last_four VARCHAR(4) NOT NULL, card_expiry VARCHAR(7) NOT NULL,
 payment_status VARCHAR(20) NOT NULL DEFAULT 'active',
 enrolled_by_agent_id INTEGER REFERENCES agents(id),
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE customers
 ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'phone_plan',
 ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
 ADD COLUMN IF NOT EXISTS subscription_price DECIMAL(10,2),
 ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255),
 ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50),
 ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
 ADD COLUMN IF NOT EXISTS plan_sku VARCHAR(50);
CREATE TABLE IF NOT EXISTS devices (
 id SERIAL PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 device_type VARCHAR(50) NOT NULL, device_name VARCHAR(255),
 imei VARCHAR(15), serial_number VARCHAR(255), brand VARCHAR(100), model VARCHAR(100),
 color VARCHAR(50), purchased_date DATE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_unique ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
UPDATE customers SET plan_sku = CASE WHEN subscription_plan = 'phone_plan' THEN 'DPPhoneProtect'
 WHEN subscription_plan = 'gadget_phone_plan' THEN 'DPTotalProtect' ELSE subscription_plan END WHERE plan_sku IS NULL;
CREATE OR REPLACE FUNCTION enforce_device_plan() RETURNS trigger AS $$
DECLARE plan VARCHAR; state VARCHAR; count_phones INTEGER;
BEGIN
 SELECT subscription_plan, subscription_status INTO plan, state FROM customers WHERE id = NEW.customer_id FOR UPDATE;
 IF state IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Subscription is not active' USING ERRCODE = 'P0001'; END IF;
 IF plan NOT IN ('phone_plan','gadget_phone_plan') THEN RAISE EXCEPTION 'Unknown subscription plan' USING ERRCODE = 'P0001'; END IF;
 IF NEW.device_type NOT IN ('phone','laptop','tablet','watch','headphones','camera','speaker') THEN
 RAISE EXCEPTION 'Invalid device type' USING ERRCODE = 'P0001'; END IF;
 IF plan = 'phone_plan' THEN
  IF NEW.device_type <> 'phone' THEN RAISE EXCEPTION 'Gadgets require the Gadget + Phone Plan' USING ERRCODE = 'P0001'; END IF;
  SELECT COUNT(*) INTO count_phones FROM devices WHERE customer_id = NEW.customer_id AND id IS DISTINCT FROM NEW.id;
  IF count_phones >= 1 THEN RAISE EXCEPTION 'The Phone Plan allows one phone' USING ERRCODE = 'P0001'; END IF;
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS devices_plan_guard ON devices;
CREATE TRIGGER devices_plan_guard BEFORE INSERT OR UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION enforce_device_plan();
`

