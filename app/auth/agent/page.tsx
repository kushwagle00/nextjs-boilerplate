import Link from 'next/link'
import { AgentLoginForm } from '@/components/agent-login-form'

export const dynamic = 'force-dynamic'

export default function AgentAuthPage() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
    <Link href="/" className="text-sm underline">Back to Home</Link>
    <AgentLoginForm />
    {process.env.DEMO_MODE === 'true' && !process.env.DEMO_DATABASE_URL &&
      <p className="text-center text-sm text-muted-foreground">Local demo: agent@example.com / DemoAgent123!</p>}
  </main>
}
