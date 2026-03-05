import { loadEnvConfig } from '@next/env'
import { neon } from '@neondatabase/serverless'
import { schema } from '../lib/schema'
async function main() {
loadEnvConfig(process.cwd())
const url = process.env.DEMO_MODE === 'true' ? process.env.DEMO_DATABASE_URL : process.env.DATABASE_URL
if (!url) throw new Error('Set the intended database URL explicitly; local demo initializes itself')
const sql = neon(url)
const statements = schema.split(/;\s*\n(?=(?:CREATE|ALTER|DROP|UPDATE)\b)/).map(s => s.trim()).filter(Boolean)
await sql.transaction(statements.map(statement => sql.query(statement, [])))
console.log('Schema migration completed')


}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
