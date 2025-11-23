'use client'

import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, Layers, FolderKanban, TrendingUp, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await adminApi.getSystemStats()
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          description={`${stats?.activeStudents || 0} active`}
          icon={Users}
        />
        <StatsCard
          title="Total Trainers"
          value={stats?.totalTrainers || 0}
          description="Across all batches"
          icon={GraduationCap}
        />
        <StatsCard
          title="Total Batches"
          value={stats?.totalBatches || 0}
          description="Active batches"
          icon={Layers}
        />
        <StatsCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          description="Available projects"
          icon={FolderKanban}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
            <CardDescription>Latest student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentEnrollments && stats.recentEnrollments.length > 0 ? (
                stats.recentEnrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{enrollment.profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{enrollment.profile?.email}</p>
                    </div>
                    <Badge variant="outline">
                      {enrollment.track === 'data_professional' ? 'DP' : 'FSD'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent enrollments</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
            <CardDescription>Submissions awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold">{stats?.pendingSubmissions || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Submissions pending trainer review
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Overall system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium">API</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium">Workspaces</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

