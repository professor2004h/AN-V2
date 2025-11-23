'use client'

import { useQuery } from '@tanstack/react-query'
import { trainerApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, TrendingUp, CheckCircle, Clock } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: students, isLoading } = useQuery({
    queryKey: ['trainer', 'students'],
    queryFn: async () => {
      const response = await trainerApi.getStudents()
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  const totalStudents = students?.length || 0
  const activeStudents = students?.filter((s: any) => s.status === 'active').length || 0
  const avgProgress = students?.reduce((acc: number, s: any) => acc + (s.overall_progress || 0), 0) / (totalStudents || 1)
  const completedProjects = students?.reduce((acc: number, s: any) => 
    acc + (s.student_projects?.filter((p: any) => p.status === 'approved').length || 0), 0
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your students' performance and progress
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={totalStudents}
          description={`${activeStudents} active`}
          icon={Users}
        />
        <StatsCard
          title="Average Progress"
          value={`${Math.round(avgProgress)}%`}
          description="Across all students"
          icon={TrendingUp}
        />
        <StatsCard
          title="Completed Projects"
          value={completedProjects}
          description="Total approved projects"
          icon={CheckCircle}
        />
        <StatsCard
          title="Avg Response Time"
          value="< 24h"
          description="Review turnaround"
          icon={Clock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Progress Overview</CardTitle>
          <CardDescription>Individual student progress breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {students?.map((student: any) => (
            <div key={student.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{student.profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.track === 'data_professional' ? 'Data Professional' : 'Full-Stack Dev'}
                  </p>
                </div>
                <span className="text-sm font-medium">{student.overall_progress || 0}%</span>
              </div>
              <Progress value={student.overall_progress || 0} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

