'use client'

import { useQuery } from '@tanstack/react-query'
import { adminApi, superadminApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, TrendingUp, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await adminApi.getSystemStats()
      return response.data
    },
  })

  const { data: revenueStats, isLoading: revenueLoading } = useQuery({
    queryKey: ['superadmin', 'revenue'],
    queryFn: async () => {
      const response = await superadminApi.getRevenueStats()
      return response.data
    },
  })

  if (statsLoading || revenueLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Complete system overview with financial insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${(revenueStats?.totalRevenue || 0).toLocaleString()}`}
          description="All-time revenue"
          icon={DollarSign}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${(revenueStats?.monthlyRevenue || 0).toLocaleString()}`}
          description="This month"
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          description={`${stats?.activeStudents || 0} active`}
          icon={Users}
        />
        <StatsCard
          title="Payment Success Rate"
          value="95%"
          description="Successful payments"
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Track */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue by Track</CardTitle>
                <CardDescription>Income breakdown by learning track</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/superadmin/revenue">View Details</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueStats?.revenueByTrack?.map((track: any) => (
              <div key={track.track} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {track.track === 'data_professional' ? 'Data Professional' : 'Full-Stack Dev'}
                  </p>
                  <p className="text-sm text-muted-foreground">{track.count} students</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  ${track.total.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Payment breakdown by status</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/superadmin/payments">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueStats?.revenueByStatus?.map((status: any) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={status.status === 'completed' ? 'success' : 'warning'}>
                    {status.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{status.count} payments</span>
                </div>
                <span className="font-medium">${status.total.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrollments</CardTitle>
          <CardDescription>Latest student registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentEnrollments && stats.recentEnrollments.length > 0 ? (
              stats.recentEnrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{enrollment.profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{enrollment.profile?.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {enrollment.track === 'data_professional' ? 'DP' : 'FSD'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {enrollment.payment_status === 'completed' ? 'Paid' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent enrollments</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

