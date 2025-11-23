'use client'

import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, TrendingUp, CheckCircle, DollarSign } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await adminApi.getSystemStats()
      return response.data
    },
  })

  const { data: students } = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: async () => {
      const response = await adminApi.getAllStudents()
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  const dpStudents = students?.students?.filter((s: any) => s.track === 'data_professional').length || 0
  const fsdStudents = students?.students?.filter((s: any) => s.track === 'full_stack_dev').length || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          System-wide analytics and insights
        </p>
      </div>

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
          description="Active trainers"
          icon={TrendingUp}
        />
        <StatsCard
          title="Completion Rate"
          value="75%"
          description="Average completion"
          icon={CheckCircle}
        />
        <StatsCard
          title="Revenue"
          value="$125K"
          description="Total revenue"
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment by Track</CardTitle>
            <CardDescription>Student distribution across tracks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Professional</span>
                <span className="text-sm text-muted-foreground">{dpStudents} students</span>
              </div>
              <Progress value={(dpStudents / (stats?.totalStudents || 1)) * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Full-Stack Developer</span>
                <span className="text-sm text-muted-foreground">{fsdStudents} students</span>
              </div>
              <Progress value={(fsdStudents / (stats?.totalStudents || 1)) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Recent system metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Submissions</span>
              <span className="text-sm font-bold">{stats?.pendingSubmissions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Batches</span>
              <span className="text-sm font-bold">{stats?.totalBatches || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Projects</span>
              <span className="text-sm font-bold">{stats?.totalProjects || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

