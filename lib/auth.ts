import { cookies } from 'next/headers'
import { getDb } from './db'

const SESSION_COOKIE = 'agent_session'

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('')
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  
  const hashHex = Array.from(new Uint8Array(derivedBits), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')
  
  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, ] = storedHash.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  
  const hashHex = Array.from(new Uint8Array(derivedBits), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')
  
  const newHash = `${saltHex}:${hashHex}`
  return newHash === storedHash
}

export async function registerAgent(email: string, password: string, fullName: string) {
  const sql = getDb()
  
  const existing = await sql`SELECT id FROM agents WHERE email = ${email.toLowerCase()}`
  if (existing.length > 0) {
    return { error: 'An agent with this email already exists' }
  }
  
  const passwordHash = await hashPassword(password)
  const result = await sql`
    INSERT INTO agents (email, password_hash, full_name) 
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${fullName}) 
    RETURNING id, email, full_name
  `
  
  return { agent: result[0] }
}

export async function loginAgent(email: string, password: string) {
  const sql = getDb()
  
  const agents = await sql`SELECT id, email, password_hash, full_name FROM agents WHERE email = ${email.toLowerCase()}`
  if (agents.length === 0) {
    return { error: 'Invalid email or password' }
  }
  
  const agent = agents[0]
  const validPassword = await verifyPassword(password, agent.password_hash)
  if (!validPassword) {
    return { error: 'Invalid email or password' }
  }
  
  return { agent: { id: agent.id, email: agent.email, full_name: agent.full_name } }
}

export async function createSession(agentId: number) {
  const token = generateSessionToken()
  const cookieStore = await cookies()
  
  cookieStore.set(SESSION_COOKIE, `${agentId}:${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  
  return token
}

export async function getSession(): Promise<{ agentId: number; email: string; fullName: string } | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)
  
  if (!sessionCookie) return null
  
  const [agentIdStr] = sessionCookie.value.split(':')
  const agentId = parseInt(agentIdStr, 10)
  if (isNaN(agentId)) return null
  
  const sql = getDb()
  const agents = await sql`SELECT id, email, full_name FROM agents WHERE id = ${agentId}`
  if (agents.length === 0) return null
  
  return {
    agentId: agents[0].id,
    email: agents[0].email,
    fullName: agents[0].full_name,
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
