/** @jest-environment node */
import { signSession, verifySession } from '@/lib/session-token'
import { hashPassword, verifyPassword } from '@/lib/password'

beforeEach(() => { process.env.SESSION_SECRET = 'test-secret-with-at-least-32-characters' })

test('rejects legacy, forged, malformed, expired, and wrong-role cookies', () => {
  const now = 100000
  const token = signSession(7, 'agent', now)
  expect(verifySession(token, 'agent', now)?.id).toBe(7)
  expect(verifySession(token, 'customer', now)).toBeNull()
  expect(verifySession(token, 'agent', now + 86400000)).toBeNull()
  expect(verifySession('1:anything', 'agent', now)).toBeNull()
  expect(verifySession(JSON.stringify({ customerId: 7 }), 'customer', now)).toBeNull()
  expect(verifySession(token.slice(0, -1) + '!', 'agent', now)).toBeNull()
  expect(verifySession(signSession(-1, 'agent', now), 'agent', now)).toBeNull()
})

test('requires a configured secret', () => {
  delete process.env.SESSION_SECRET
  expect(() => signSession(1, 'agent')).toThrow('SESSION_SECRET')
})

test('passwords are salted and malformed stored hashes fail closed', () => {
  const hash = hashPassword('ExamplePassword123!')
  expect(hashPassword('ExamplePassword123!')).not.toBe(hash)
  expect(verifyPassword('ExamplePassword123!', hash)).toBe(true)
  expect(verifyPassword('wrong', hash)).toBe(false)
  expect(verifyPassword('anything', 'invalid')).toBe(false)
})

