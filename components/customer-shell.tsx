'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Smartphone, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Logged out successfully')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Smartphone className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Device Protection</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Navigation */}
          <nav className="mb-8 flex gap-2 border-b pb-4">
            <Link href="/customer/devices">
              <Button
                variant={pathname === '/customer/devices' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Smartphone className="h-4 w-4" />
                My Devices
              </Button>
            </Link>
          </nav>

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  )
}
