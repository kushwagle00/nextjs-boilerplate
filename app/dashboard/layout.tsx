import { cookies, redirect } from 'next/headers'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('agent_session')

  if (!sessionCookie?.value) {
    redirect('/auth/agent')
  }

  let agentName = 'Agent'
  let agentEmail = ''
  
  try {
    const session = JSON.parse(sessionCookie.value)
    agentEmail = session.email || ''
  } catch (e) {
    console.error('[v0] Session parse error:', e)
  }

  return (
    <DashboardShell agentName={agentName} agentEmail={agentEmail}>
      {children}
    </DashboardShell>
  )
}
