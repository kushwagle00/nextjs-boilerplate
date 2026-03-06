-- Add plan_sku column if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS plan_sku VARCHAR(50);

-- Backfill existing rows based on subscription_plan
UPDATE customers
SET plan_sku = CASE
  WHEN subscription_plan = 'phone_plan' THEN 'DPPhoneProtect'
  WHEN subscription_plan = 'gadget_phone_plan' THEN 'DPTotalProtect'
  ELSE subscription_plan
END
WHERE plan_sku IS NULL;
