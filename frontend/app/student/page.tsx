'use client'

import { useQuery } from '@tanstack/react-query'
import { studentApi, taskApi, notificationApi } from '@/lib/api'
import { StatsCard } from '@/components/shared/stats-card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { FolderKanban, CheckSquare, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getStatusColor, formatDate } from '@/lib/utils'

export default function StudentDashboard() {
  // Fetch student data
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', 'me'],
    queryFn: async () => {
      const response = await studentApi.getMe()
      return response.data
    },
  })

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['student', 'projects'],
    queryFn: async () => {
      const response = await studentApi.getProjects()
      return response.data
    },
  })

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['student', 'tasks'],
    queryFn: async () => {
      const response = await studentApi.getTasks()
      return response.data
    },
  })

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationApi.getAll()
      return response.data
    },
  })

  if (studentLoading || projectsLoading || tasksLoading) {
    return <LoadingSpinner />
  }

  const currentProject = projects?.find((p: any) => p.status === 'in_progress')
  const completedProjects = projects?.filter((p: any) => p.status === 'approved').length || 0
  const pendingTasks = tasks?.filter((t: any) => t.status === 'pending').length || 0
  const overallProgress = student?.overall_progress || 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {student?.profile?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your learning progress overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Overall Progress"
          value={`${overallProgress}%`}
          description="Across all projects"
          icon={TrendingUp}
        />
        <StatsCard
          title="Completed Projects"
          value={completedProjects}
          description={`Out of ${projects?.length || 0} total`}
          icon={FolderKanban}
        />
        <StatsCard
          title="Pending Tasks"
          value={pendingTasks}
          description="Tasks to complete"
          icon={CheckSquare}
        />
        <StatsCard
          title="Time Spent"
          value={student?.time_spent_hours || 0}
          description="Hours of learning"
          icon={Clock}
        />
      </div>

      {/* Current Project */}
      {currentProject && (
        <Card>
          <CardHeader>
            <CardTitle>Current Project</CardTitle>
            <CardDescription>Your active project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{currentProject.project?.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentProject.project?.description}
                  </p>
                </div>
                <Badge variant={getStatusColor(currentProject.status) as any}>
                  {currentProject.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{currentProject.progress_percentage}%</span>
                </div>
                <Progress value={currentProject.progress_percentage} />
              </div>

              <Button asChild>
                <Link href={`/student/projects/${currentProject.id}`}>
                  Continue Project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks && tasks.length > 0 ? (
                tasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(task.due_date)}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(task.status) as any}>
                      {task.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
              )}
              <Button variant="outline" asChild className="w-full">
                <Link href="/student/tasks">View All Tasks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 5).map((notif: any) => (
                  <div key={notif.id} className="space-y-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notifications</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

