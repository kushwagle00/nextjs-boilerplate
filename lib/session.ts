import { cookies } from 'next/headers'
import { getDb } from './db'
import { signSession, verifySession, type SessionRole } from './session-token'

export async function setSession(id: number, role: SessionRole) {
  const store = await cookies()
  store.set(role + '_session', signSession(id, role), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: 86400,
  })
}

async function readSession(role: SessionRole) {
  const token = (await cookies()).get(role + '_session')?.value
  return token ? verifySession(token, role) : null
}

export async function getAgentSession() {
  const claims = await readSession('agent')
  if (!claims) return null
  const sql = getDb()
  const rows = await sql`SELECT id, email, full_name FROM agents WHERE id = ${claims.id}`
  return rows[0] ? { agentId: Number(rows[0].id), email: String(rows[0].email), fullName: String(rows[0].full_name) } : null
}

export async function getCustomerSession() {
  const claims = await readSession('customer')
  if (!claims) return null
  const sql = getDb()
  const rows = await sql`SELECT id, email, first_name, last_name, subscription_plan, subscription_status FROM customers WHERE id = ${claims.id}`
  const c = rows[0]
  return c && c.subscription_status === 'active'
    ? { customerId: Number(c.id), email: String(c.email), name: c.first_name + ' ' + c.last_name, plan: String(c.subscription_plan) }
    : null
}

