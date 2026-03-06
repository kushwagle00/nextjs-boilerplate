import { getDb } from './db'
import { deviceSchema } from './validations'

export async function addDevice(customerId: number, input: unknown) {
  const parsed = deviceSchema.safeParse(input)
  if (!parsed.success) return { status: 400, errors: Object.fromEntries(parsed.error.issues.map(i => [String(i.path[0]), i.message])) }
  const d = parsed.data
  const sql = getDb()
  const rows = await sql`SELECT subscription_plan, subscription_status FROM customers WHERE id = ${customerId}`
  const customer = rows[0]
  if (!customer || customer.subscription_status !== 'active') return { status: 403, errors: { general: 'Your subscription is not active' } }
  if (!['phone_plan', 'gadget_phone_plan'].includes(customer.subscription_plan)) return { status: 403, errors: { general: 'Unknown subscription plan' } }
  if (customer.subscription_plan === 'phone_plan') {
    if (d.type !== 'phone') return { status: 403, errors: { general: 'Gadgets require the Gadget + Phone Plan' } }
    const count = await sql`SELECT COUNT(*) AS count FROM devices WHERE customer_id = ${customerId}`
    if (Number(count[0].count) >= 1) return { status: 409, errors: { general: 'The Phone Plan allows one phone' } }
  }
  try {
    const result = await sql`INSERT INTO devices (customer_id,device_type,device_name,brand,model,imei,serial_number,color,purchased_date)
      VALUES (${customerId},${d.type},${d.deviceName},${d.brand},${d.model},${d.imei || null},${d.serialNumber || null},${d.color || null},${d.purchaseDate}) RETURNING id`
    return { status: 201, deviceId: result[0].id }
  } catch (error) {
    // The database trigger serializes concurrent inserts against the customer's plan.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P0001')
      return { status: 409, errors: { general: 'Device limit reached or subscription inactive' } }
    throw error
  }
}

