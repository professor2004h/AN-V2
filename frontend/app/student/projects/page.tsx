'use client'

import { useQuery } from '@tanstack/react-query'
import { studentApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { FolderKanban, Lock, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { getStatusColor, getTrackLabel } from '@/lib/utils'

export default function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['student', 'projects'],
    queryFn: async () => {
      const response = await studentApi.getProjects()
      return response.data
    },
  })

  const { data: student } = useQuery({
    queryKey: ['student', 'me'],
    queryFn: async () => {
      const response = await studentApi.getMe()
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'locked':
        return <Lock className="h-5 w-5" />
      case 'in_progress':
        return <Clock className="h-5 w-5" />
      case 'approved':
        return <CheckCircle className="h-5 w-5" />
      case 'rejected':
        return <XCircle className="h-5 w-5" />
      default:
        return <FolderKanban className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-muted-foreground mt-2">
          Track: {getTrackLabel(student?.track)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project: any) => (
          <Card key={project.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(project.status)}
                  <CardTitle className="text-lg">{project.project?.title}</CardTitle>
                </div>
                <Badge variant={getStatusColor(project.status) as any}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {project.project?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress_percentage}%</span>
                </div>
                <Progress value={project.progress_percentage} />
              </div>

              {/* Tech Stack */}
              {project.project?.tech_stack && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {project.project.tech_stack.slice(0, 3).map((tech: string) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.project.tech_stack.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.project.tech_stack.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Grade */}
              {project.grade && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Grade</span>
                  <span className="font-bold text-green-600">{project.grade}/100</span>
                </div>
              )}

              {/* Action Button */}
              <Button
                asChild
                className="w-full"
                disabled={project.status === 'locked'}
                variant={project.status === 'locked' ? 'outline' : 'default'}
              >
                {project.status === 'locked' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    Locked
                  </div>
                ) : (
                  <Link href={`/student/projects/${project.id}`}>
                    {project.status === 'in_progress' ? 'Continue' : 'View Details'}
                  </Link>
                )}
              </Button>
            </CardContent>

            {/* Locked Overlay */}
            {project.status === 'locked' && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <Lock className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Complete previous project to unlock</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

