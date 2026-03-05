import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { CustomerShell } from '@/components/customer-shell'

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('customer_session')

  if (!sessionCookie?.value) {
    redirect('/auth/customer')
  }

  return <CustomerShell>{children}</CustomerShell>
}
