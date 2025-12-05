'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentApi, workspaceApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Code, Play, Square, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function WorkspacePage() {
  const queryClient = useQueryClient()
  const [provisioningProgress, setProvisioningProgress] = useState(0)
  const [provisioningMessage, setProvisioningMessage] = useState('')
  const [isProvisioning, setIsProvisioning] = useState(false)

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

  // Real-time provisioning with SSE using fetch (supports auth headers)
  const handleProvisionWithProgress = async () => {
    setIsProvisioning(true)
    setProvisioningProgress(0)
    setProvisioningMessage('Starting provisioning...')

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast.error('Authentication required')
        setIsProvisioning(false)
        return
      }

      // Use fetch for SSE with auth headers
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/workspaces/provision-stream`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Accept': 'text/event-stream',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to start provisioning')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.error) {
              toast.error(data.error)
              setIsProvisioning(false)
              return
            }

            if (data.progress !== undefined) {
              setProvisioningProgress(data.progress)
              setProvisioningMessage(data.message)
            }

            if (data.progress === 100) {
              toast.success('Workspace provisioned successfully!')
              setIsProvisioning(false)
              queryClient.invalidateQueries({ queryKey: ['workspace'] })
              return
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Provisioning error:', error)
      toast.error(error.message || 'Failed to provision workspace')
      setIsProvisioning(false)
    }
  }

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

  // Auto-stop detection when user closes tab or logs out
  useEffect(() => {
    if (workspace?.status !== 'running') return

    const handleBeforeUnload = async () => {
      // Send one last heartbeat update before closing
      try {
        await workspaceApi.heartbeat()
      } catch (error) {
        console.error('Failed to send final heartbeat:', error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [workspace?.status])

  // Dead workspace detection
  const [isWorkspaceDead, setIsWorkspaceDead] = useState(false)

  useEffect(() => {
    if (!workspace?.url || workspace.status !== 'running') {
      setIsWorkspaceDead(false)
      return
    }

    // Check if workspace is actually reachable
    const checkWorkspaceHealth = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        // Use no-cors mode since workspace is on different subdomain
        // This returns an opaque response but doesn't throw CORS error
        const response = await fetch(workspace.url, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // With no-cors, we get type='opaque' and status=0 if reachable
        // This is actually success - the server responded
        if (response.type === 'opaque') {
          setIsWorkspaceDead(false)
          return
        }

        // If we somehow get a real response, check for gateway errors
        if (response.status === 504 || response.status === 502 || response.status === 503) {
          setIsWorkspaceDead(true)
        } else {
          setIsWorkspaceDead(false)
        }
      } catch (error: any) {
        // Only mark as dead if it's a network error (not CORS)
        // AbortError means timeout - server didn't respond
        if (error.name === 'AbortError') {
          setIsWorkspaceDead(true)
        } else {
          // Other errors might be temporary, don't immediately mark as dead
          console.log('Workspace health check error:', error.message)
          setIsWorkspaceDead(false)
        }
      }
    }

    // Check after a short delay to let ALB register
    const initialCheck = setTimeout(checkWorkspaceHealth, 3000)

    // Then check every 30 seconds
    const interval = setInterval(checkWorkspaceHealth, 30000)

    return () => {
      clearTimeout(initialCheck)
      clearInterval(interval)
    }
  }, [workspace?.url, workspace?.status])

  if (isLoading) {
    return <LoadingSpinner />
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      running: 'success',
      starting: 'warning',
      stopped: 'secondary',
      provisioning: 'warning',
      error: 'destructive',
    }
    return variants[status] || 'default'
  }

  const estimateTimeRemaining = (progress: number) => {
    if (progress === 0) return '3-4 minutes'
    if (progress < 30) return '3-4 minutes'
    if (progress < 50) return '2-3 minutes'
    if (progress < 75) return '1-2 minutes'
    if (progress < 95) return 'Less than 1 minute'
    return 'Almost done...'
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
                VS Code in your browser with auto-save enabled
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
                  <br />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    First-time provisioning takes 3-4 minutes. Subsequent access is instant!
                  </span>
                </AlertDescription>
              </Alert>

              {isProvisioning ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{provisioningMessage}</span>
                      <span className="text-muted-foreground">{provisioningProgress}%</span>
                    </div>
                    <Progress value={provisioningProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Estimated time remaining: {estimateTimeRemaining(provisioningProgress)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Please wait while we set up your workspace...</span>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleProvisionWithProgress}
                  disabled={isProvisioning}
                  className="w-full"
                >
                  Provision Workspace
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Workspace URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                    {workspace.url}
                  </code>
                  {workspace.status === 'running' && !isWorkspaceDead && (
                    <Button asChild size="sm">
                      <a href={workspace.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>

                {isWorkspaceDead && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Workspace is not responding.</strong> The container may have been terminated.
                      <br />
                      <span className="text-xs">Don't worry! Your files are safe on persistent storage.</span>
                      <br />
                      <Button
                        onClick={handleProvisionWithProgress}
                        disabled={isProvisioning}
                        className="mt-2"
                        size="sm"
                      >
                        Reprovision Workspace
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {workspace.status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    There was an error with your workspace. Please contact your trainer or admin for assistance.
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
                    {startMutation.isPending ? 'Starting...' : 'Start Workspace'}
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
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Auto-save is enabled!</strong> Your files are automatically saved 1 second after you stop typing.
                  <br />
                  <strong>Auto-stop:</strong> Your workspace will automatically stop after 15 minutes of inactivity to save resources.
                </AlertDescription>
              </Alert>
            </>
          )}

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Pre-installed Tools:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Python 3.11 + pip</li>
              <li>• Node.js 20 + npm</li>
              <li>• Git version control</li>
              <li>• Auto-save enabled (1 second delay)</li>
              <li>• Dark theme by default</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
