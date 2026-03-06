import { redirect } from 'next/navigation'
import { getAgentSession } from '@/lib/session'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAgentSession()
  if (!session) redirect('/auth/agent')
  return <DashboardShell agentName={session.fullName} agentEmail={session.email}>{children}</DashboardShell>
}
