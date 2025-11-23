'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { trainerApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Mail, Github, Calendar, TrendingUp, FolderKanban, CheckSquare } from 'lucide-react'
import { formatDate, getStatusColor, getTrackLabel } from '@/lib/utils'

export default function StudentDetailPage() {
  const params = useParams()

  const { data: students, isLoading } = useQuery({
    queryKey: ['trainer', 'students'],
    queryFn: async () => {
      const response = await trainerApi.getStudents()
      return response.data
    },
  })

  const student = students?.find((s: any) => s.id === params.id)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    )
  }

  const completedProjects = student.student_projects?.filter((p: any) => p.status === 'approved').length || 0
  const totalProjects = student.student_projects?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{student.profile?.full_name}</h1>
          <p className="text-muted-foreground mt-2">{student.profile?.email}</p>
        </div>
        <Badge variant={getStatusColor(student.status) as any}>
          {student.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Overall Progress"
          value={`${student.overall_progress || 0}%`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Completed Projects"
          value={`${completedProjects}/${totalProjects}`}
          icon={FolderKanban}
        />
        <StatsCard
          title="Tasks Completed"
          value={student.tasks?.filter((t: any) => t.status === 'completed').length || 0}
          icon={CheckSquare}
        />
        <StatsCard
          title="Time Spent"
          value={`${student.time_spent_hours || 0}h`}
          icon={Calendar}
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm text-muted-foreground">{student.profile?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">GitHub</p>
                    <p className="text-sm text-muted-foreground">{student.github_username || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Track</p>
                    <p className="text-sm text-muted-foreground">{getTrackLabel(student.track)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {student.student_projects?.map((project: any) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.project?.title}</CardTitle>
                  <Badge variant={getStatusColor(project.status) as any}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <CardDescription>{project.project?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{project.progress_percentage}%</span>
                  </div>
                  <Progress value={project.progress_percentage} />
                </div>
                {project.grade && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Grade</span>
                    <span className="text-sm font-bold text-green-600">{project.grade}/100</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {student.tasks && student.tasks.length > 0 ? (
            student.tasks.map((task: any) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <Badge variant={getStatusColor(task.status) as any}>
                      {task.status}
                    </Badge>
                  </div>
                  <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Due: {formatDate(task.due_date)}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No tasks assigned</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

