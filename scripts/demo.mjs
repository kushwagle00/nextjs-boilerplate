import nextEnv from '@next/env'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

nextEnv.loadEnvConfig(process.cwd())
process.env.DEMO_MODE = 'true'
if (!process.env.SESSION_SECRET) {
  const file = '.demo-secret'
  if (!existsSync(file)) writeFileSync(file, randomBytes(48).toString('hex'), { mode: 0o600 })
  process.env.SESSION_SECRET = readFileSync(file, 'utf8').trim()
}
const require = createRequire(import.meta.url)
const production = process.argv.includes('--production')
console.log('Demo mode: synthetic data and simulated payments. Local accounts: agent@example.com / DemoAgent123!; alex@example.com / 2025550100.')
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), production ? 'start' : 'dev', '--hostname', '127.0.0.1', ...process.argv.slice(2).filter(a => a !== '--production')], { stdio: 'inherit', env: process.env })
child.on('exit', code => process.exit(code ?? 1))

