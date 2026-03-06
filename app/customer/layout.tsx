import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/session'
import { CustomerShell } from '@/components/customer-shell'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  if (!await getCustomerSession()) redirect('/auth/customer')
  return <CustomerShell>{children}</CustomerShell>
}
