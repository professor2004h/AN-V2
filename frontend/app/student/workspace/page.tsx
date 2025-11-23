'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentApi, workspaceApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code, Play, Square, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function WorkspacePage() {
  const queryClient = useQueryClient()

  const { data: student } = useQuery({
    queryKey: ['student', 'me'],
    queryFn: async () => {
      const response = await studentApi.getMe()
      return response.data
    },
  })

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', student?.id],
    queryFn: async () => {
      if (!student?.id) return null
      const response = await workspaceApi.getWorkspace(student.id)
      return response.data
    },
    enabled: !!student?.id,
  })

  const provisionMutation = useMutation({
    mutationFn: async () => {
      const response = await workspaceApi.provision()
      return response.data
    },
    onSuccess: () => {
      toast.success('Workspace provisioned successfully!')
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
    },
    onError: () => {
      toast.error('Failed to provision workspace')
    },
  })

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await workspaceApi.startWorkspace(student!.id)
      return response.data
    },
    onSuccess: () => {
      toast.success('Workspace started')
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
    },
  })

  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await workspaceApi.stopWorkspace(student!.id)
      return response.data
    },
    onSuccess: () => {
      toast.success('Workspace stopped')
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await workspaceApi.deleteWorkspace(student!.id)
      return response.data
    },
    onSuccess: () => {
      toast.success('Workspace deleted')
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
    },
  })

  // Heartbeat effect to keep workspace alive
  useEffect(() => {
    if (workspace?.status !== 'running') return

    const sendHeartbeat = async () => {
      try {
        await workspaceApi.heartbeat()
      } catch (error) {
        console.error('Failed to send heartbeat:', error)
      }
    }

    // Send immediately
    sendHeartbeat()

    // Then every 60 seconds
    const interval = setInterval(sendHeartbeat, 60 * 1000)

    return () => clearInterval(interval)
  }, [workspace?.status])

  if (isLoading) {
    return <LoadingSpinner />
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      running: 'success',
      stopped: 'secondary',
      provisioning: 'warning',
      error: 'destructive',
    }
    return variants[status] || 'default'
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">My Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Your personal browser-based development environment
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Code-Server Workspace</CardTitle>
              <CardDescription>
                VS Code in your browser with all tools pre-installed
              </CardDescription>
            </div>
            {workspace?.status && (
              <Badge variant={getStatusBadge(workspace.status)}>
                {workspace.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!workspace || !workspace.url ? (
            <>
              <Alert>
                <Code className="h-4 w-4" />
                <AlertDescription>
                  You don't have a workspace yet. Click below to provision your personal development environment.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => provisionMutation.mutate()}
                disabled={provisionMutation.isPending}
                className="w-full"
              >
                {provisionMutation.isPending ? 'Provisioning...' : 'Provision Workspace'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Workspace URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                    {workspace.url}
                  </code>
                  {workspace.status === 'running' && (
                    <Button asChild size="sm">
                      <a href={workspace.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {workspace.status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    There was an error with your workspace. Please try deleting and provisioning again.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {workspace.status === 'stopped' && (
                  <Button
                    onClick={() => startMutation.mutate()}
                    disabled={startMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Workspace
                  </Button>
                )}
                {workspace.status === 'running' && (
                  <Button
                    variant="outline"
                    onClick={() => stopMutation.mutate()}
                    disabled={stopMutation.isPending}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Workspace
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your workspace? This cannot be undone.')) {
                      deleteMutation.mutate()
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Workspace
                </Button>
              </div>
            </>
          )}

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Pre-installed Tools:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Python 3 + Data Science libraries (pandas, numpy, matplotlib, jupyter)</li>
              <li>• Node.js + React, Next.js, NestJS</li>
              <li>• PostgreSQL client</li>
              <li>• Git + GitHub CLI</li>
              <li>• VS Code extensions (Python, ESLint, Prettier, Tailwind, Docker)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

