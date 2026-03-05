import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  return salt + ':' + pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex')
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!/^[a-f0-9]{32}:[a-f0-9]{64}$/.test(storedHash)) return false
  const [salt, hash] = storedHash.split(':')
  return timingSafeEqual(Buffer.from(hash, 'hex'), pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256'))
}

