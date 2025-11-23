'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentApi, taskApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckSquare, Clock, AlertCircle } from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'
import { toast } from 'sonner'

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string>('all')

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['student', 'tasks', filter],
    queryFn: async () => {
      const response = await taskApi.getAll(filter !== 'all' ? filter : undefined)
      return response.data
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await taskApi.updateStatus(taskId, status)
      return response.data
    },
    onSuccess: () => {
      toast.success('Task status updated')
      queryClient.invalidateQueries({ queryKey: ['student', 'tasks'] })
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'destructive'
    if (priority === 'medium') return 'warning'
    return 'default'
  }

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage your assigned tasks
        </p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {tasks && tasks.length > 0 ? (
            tasks.map((task: any) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge variant={getPriorityColor(task.priority) as any}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <Badge variant={getStatusColor(task.status) as any}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {isOverdue(task.due_date) && task.status !== 'completed' && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Due: {formatDate(task.due_date)}
                    </div>
                    {task.project && (
                      <div>Project: {task.project.title}</div>
                    )}
                  </div>

                  {task.status !== 'completed' && (
                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                        >
                          Start Task
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="No tasks found"
              description={`You don't have any ${filter !== 'all' ? filter : ''} tasks at the moment.`}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

