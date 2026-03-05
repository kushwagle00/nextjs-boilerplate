import { neon } from '@neondatabase/serverless'

export function getDb() {
  // Demo mode never falls back to the application's live DATABASE_URL.
  const url = process.env.DEMO_MODE === 'true' ? process.env.DEMO_DATABASE_URL : process.env.DATABASE_URL
  return async (strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, any>[]> => {
    if (url) return neon(url)(strings, ...values)
    if (process.env.DEMO_MODE !== 'true') throw new Error('DATABASE_URL is not configured')
    const { getDemoDb } = await import('./demo-db')
    const db = await getDemoDb()
    const query = strings.reduce((text, part, i) => text + (i ? '$' + i : '') + part, '')
    return (await db.query<Record<string, any>>(query, values)).rows
  }
}
