import { cookies } from 'next/headers'
import { getDb } from './db'
import { hashPassword, verifyPassword } from './password'
import { setSession } from './session'
export { getAgentSession as getSession } from './session'

export async function registerAgent(email: string, password: string, fullName: string) {
  const sql = getDb()
  const existing = await sql`SELECT id FROM agents WHERE email = ${email.trim().toLowerCase()}`
  if (existing.length) return { error: 'An agent with this email already exists' }
  const result = await sql`INSERT INTO agents (email,password_hash,full_name)
    VALUES (${email.trim().toLowerCase()},${hashPassword(password)},${fullName}) RETURNING id,email,full_name`
  return { agent: result[0] }
}

export async function loginAgent(email: string, password: string) {
  const sql = getDb()
  const rows = await sql`SELECT id,email,password_hash,full_name FROM agents WHERE email = ${email.trim().toLowerCase()}`
  const agent = rows[0]
  if (!agent || !verifyPassword(password, agent.password_hash)) return { error: 'Invalid email or password' }
  return { agent: { id: agent.id, email: agent.email, full_name: agent.full_name } }
}
export async function createSession(agentId: number) { await setSession(agentId, 'agent') }
export async function destroySession() { (await cookies()).delete('agent_session') }
