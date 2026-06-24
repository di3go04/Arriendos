'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from '@/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import CookieBanner from '@/components/CookieBanner'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import ToastPremium from '@/components/ui/ToastPremium'
import { TooltipProvider } from '@/components/ui/Tooltip'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  const displayName = profile?.full_name || user.email || 'U'

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="flex h-screen overflow-hidden bg-muted">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
              <button
                className="lg:hidden -ml-2 rounded-lg p-2 hover:bg-muted"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col">
              <div className="flex-1">
                <Breadcrumbs />
                {children}
              </div>
            <footer className="border-t border-border/50 pt-4 pb-2 mt-8">
              <div className="flex justify-center gap-6 text-xs text-muted-foreground">
                <Link href="/privacidad" className="hover:text-foreground transition-colors">Política de Privacidad</Link>
                <Link href="/terminos" className="hover:text-foreground transition-colors">Términos y Condiciones</Link>
              </div>
            </footer>
          </main>
        </div>
        </div>
        <CookieBanner />
        <ToastPremium />
      </ToastProvider>
    </TooltipProvider>
  )
}
