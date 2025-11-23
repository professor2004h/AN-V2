'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { superadminApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'

export default function RevenuePage() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  const { data: revenueStats, isLoading } = useQuery({
    queryKey: ['superadmin', 'revenue', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      const response = await superadminApi.getRevenueStats(params.toString())
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive revenue analytics and insights
        </p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
          title="Average per Student"
          value={`$${Math.round((revenueStats?.totalRevenue || 0) / (revenueStats?.totalStudents || 1))}`}
          description="Revenue per student"
          icon={DollarSign}
        />
      </div>

      {/* Revenue by Track */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Track</CardTitle>
          <CardDescription>Income breakdown by learning track</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {revenueStats?.revenueByTrack?.map((track: any) => {
            const percentage = (track.total / (revenueStats.totalRevenue || 1)) * 100
            return (
              <div key={track.track} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {track.track === 'data_professional' ? 'Data Professional' : 'Full-Stack Developer'}
                    </p>
                    <p className="text-sm text-muted-foreground">{track.count} students</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${track.total.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <Progress value={percentage} />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Revenue by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Payment Status</CardTitle>
          <CardDescription>Payment breakdown by status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {revenueStats?.revenueByStatus?.map((status: any) => {
            const percentage = (status.total / (revenueStats.totalRevenue || 1)) * 100
            return (
              <div key={status.status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{status.status}</p>
                    <p className="text-sm text-muted-foreground">{status.count} payments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${status.total.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <Progress value={percentage} />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

