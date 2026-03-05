import { loadEnvConfig } from '@next/env'
import { neon } from '@neondatabase/serverless'
import { hashPassword } from '../lib/password'
async function main() {
loadEnvConfig(process.cwd())
const url = process.env.DEMO_MODE === 'true' ? process.env.DEMO_DATABASE_URL : process.env.DATABASE_URL
const email = process.env.AGENT_EMAIL?.trim().toLowerCase()
const password = process.env.AGENT_PASSWORD
const name = process.env.AGENT_NAME || 'Agent'
if (!url || !email || !password || password.length < 12) throw new Error('Set the target database URL, AGENT_EMAIL and AGENT_PASSWORD (12+ characters)')
await neon(url)`INSERT INTO agents (email,password_hash,full_name) VALUES (${email},${hashPassword(password)},${name}) ON CONFLICT (email) DO NOTHING`
console.log('Agent provisioned (existing accounts unchanged)')


}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
