'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Shield, Search, UserPlus, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardShellProps {
  children: React.ReactNode
  agentName?: string
  agentEmail?: string
  onLogout?: () => void | Promise<void>
  isCustomer?: boolean
}

export function DashboardShell({
  children,
  agentName = 'Agent',
  agentEmail = '',
  onLogout,
  isCustomer = false,
}: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    if (onLogout) {
      await onLogout()
    } else {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    }
  }

  const agentNavItems = [
    { label: 'Search Customers', href: '/dashboard', icon: Search },
    { label: 'Enroll Customer', href: '/dashboard/enroll', icon: UserPlus },
  ]

  const navItems = isCustomer ? [] : agentNavItems

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {isCustomer ? 'My Devices' : 'Agent Portal'}
            </span>
          </button>

          {!isCustomer && navItems.length > 0 && (
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    aria-label={item.label}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                )
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {agentEmail && (
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
                  <User className="h-3.5 w-3.5 text-secondary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground leading-none">{agentName}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{agentEmail}</span>
                </div>
              </div>
            )}
            <Button variant="ghost" size="icon-sm" onClick={handleLogout} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
