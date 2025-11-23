'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { DashboardHeader } from '@/components/shared/dashboard-header'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Code,
  MessageSquare,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/student', icon: LayoutDashboard },
  { name: 'Projects', href: '/student/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/student/tasks', icon: CheckSquare },
  { name: 'Workspace', href: '/student/workspace', icon: Code },
  { name: 'Messages', href: '/student/messages', icon: MessageSquare },
  { name: 'Settings', href: '/student/settings', icon: Settings },
]

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 border-r bg-background">
            <div className="flex flex-col flex-1 overflow-y-auto">
              <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/student' && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                        isActive
                          ? 'bg-navy-100 text-navy-900 dark:bg-navy-900 dark:text-white'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 md:pl-64 pt-16">
            <div className="px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

