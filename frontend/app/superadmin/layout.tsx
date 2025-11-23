'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { DashboardHeader } from '@/components/shared/dashboard-header'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  FolderKanban,
  BarChart3,
  Settings,
  DollarSign,
  CreditCard,
  TrendingUp,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Revenue', href: '/superadmin/revenue', icon: DollarSign },
  { name: 'Payments', href: '/superadmin/payments', icon: CreditCard },
  { name: 'Financial Analytics', href: '/superadmin/financial-analytics', icon: TrendingUp },
  { name: 'Trainers', href: '/admin/trainers', icon: GraduationCap },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Batches', href: '/admin/batches', icon: Layers },
  { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <ProtectedRoute allowedRoles={['superadmin']}>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 border-r bg-background">
            <div className="flex flex-col flex-1 overflow-y-auto">
              <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/superadmin' && pathname.startsWith(item.href))
                  
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

