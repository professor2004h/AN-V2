'use client'

import { useQuery } from '@tanstack/react-query'
import { trainerApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { StatsCard } from '@/components/shared/stats-card'
import { DataTable } from '@/components/shared/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Users, FileCheck, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getStatusColor } from '@/lib/utils'

export default function TrainerDashboard() {
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['trainer', 'students'],
    queryFn: async () => {
      const response = await trainerApi.getStudents()
      return response.data
    },
  })

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['trainer', 'submissions', 'pending'],
    queryFn: async () => {
      const response = await trainerApi.getPendingSubmissions()
      return response.data
    },
  })

  if (studentsLoading || submissionsLoading) {
    return <LoadingSpinner />
  }

  const activeStudents = students?.filter((s: any) => s.status === 'active').length || 0
  const pendingSubmissions = submissions?.length || 0
  const avgProgress = students?.reduce((acc: number, s: any) => acc + (s.overall_progress || 0), 0) / (students?.length || 1)

  const studentColumns = [
    {
      key: 'name',
      label: 'Student',
      render: (student: any) => (
        <div>
          <p className="font-medium">{student.profile?.full_name}</p>
          <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
        </div>
      ),
    },
    {
      key: 'track',
      label: 'Track',
      render: (student: any) => (
        <Badge variant="outline">
          {student.track === 'data_professional' ? 'Data Professional' : 'Full-Stack Dev'}
        </Badge>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (student: any) => (
        <div className="w-32">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{student.overall_progress || 0}%</span>
          </div>
          <Progress value={student.overall_progress || 0} />
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (student: any) => (
        <Badge variant={getStatusColor(student.status) as any}>
          {student.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (student: any) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/trainer/students/${student.id}`}>View Details</Link>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your students and review their progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={students?.length || 0}
          description={`${activeStudents} active`}
          icon={Users}
        />
        <StatsCard
          title="Pending Reviews"
          value={pendingSubmissions}
          description="Submissions to review"
          icon={FileCheck}
        />
        <StatsCard
          title="Average Progress"
          value={`${Math.round(avgProgress)}%`}
          description="Across all students"
          icon={TrendingUp}
        />
        <StatsCard
          title="Response Time"
          value="< 24h"
          description="Average review time"
          icon={Clock}
        />
      </div>

      {/* Pending Submissions */}
      {pendingSubmissions > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Submissions</CardTitle>
                <CardDescription>Projects waiting for your review</CardDescription>
              </div>
              <Button asChild>
                <Link href="/trainer/submissions">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions?.slice(0, 3).map((submission: any) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{submission.student_project?.student?.profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.student_project?.project?.title}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/trainer/submissions">Review</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Students</CardTitle>
          <CardDescription>All students assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={students || []}
            columns={studentColumns}
            searchable
            searchPlaceholder="Search students..."
            emptyMessage="No students assigned yet"
          />
        </CardContent>
      </Card>
    </div>
  )
}

