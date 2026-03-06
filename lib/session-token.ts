import { createHmac, timingSafeEqual } from 'node:crypto'

export type SessionRole = 'agent' | 'customer'
type Claims = { id: number; role: SessionRole; expires: number }

function secret() {
  const value = process.env.SESSION_SECRET
  if (!value || value.length < 32) throw new Error('Set SESSION_SECRET to at least 32 random characters')
  return value
}

export function signSession(id: number, role: SessionRole, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ id, role, expires: now + 86400000 })).toString('base64url')
  return payload + '.' + createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function verifySession(token: string, role: SessionRole, now = Date.now()): Claims | null {
  if (token.length > 1024) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const expected = createHmac('sha256', secret()).update(parts[0]).digest('base64url')
  if (parts[1].length !== expected.length || !timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) return null
  try {
    const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as Claims
    return claims.role === role && Number.isSafeInteger(claims.id) && claims.id > 0 &&
      Number.isFinite(claims.expires) && claims.expires > now ? claims : null
  } catch { return null }
}

