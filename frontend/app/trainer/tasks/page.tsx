'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trainerApi, taskApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { DataTable } from '@/components/shared/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'
import { toast } from 'sonner'

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    studentId: '',
    projectId: '',
    dueDate: '',
    priority: 'medium',
  })

  const { data: students } = useQuery({
    queryKey: ['trainer', 'students'],
    queryFn: async () => {
      const response = await trainerApi.getStudents()
      return response.data
    },
  })

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['trainer', 'tasks'],
    queryFn: async () => {
      const response = await taskApi.getAll()
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await taskApi.create(data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Task created successfully')
      queryClient.invalidateQueries({ queryKey: ['trainer', 'tasks'] })
      setIsCreateOpen(false)
      setTaskForm({ title: '', description: '', studentId: '', projectId: '', dueDate: '', priority: 'medium' })
    },
    onError: () => {
      toast.error('Failed to create task')
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      title: taskForm.title,
      description: taskForm.description,
      studentId: taskForm.studentId,
      projectId: taskForm.projectId || undefined,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority as 'low' | 'medium' | 'high',
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const taskColumns = [
    {
      key: 'title',
      label: 'Task',
      render: (task: any) => (
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>
      ),
    },
    {
      key: 'student',
      label: 'Student',
      render: (task: any) => task.student?.profile?.full_name || 'N/A',
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (task: any) => formatDate(task.due_date),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (task: any) => (
        <Badge variant={task.priority >= 4 ? 'destructive' : task.priority >= 3 ? 'warning' : 'default'}>
          P{task.priority}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (task: any) => (
        <Badge variant={getStatusColor(task.status) as any}>
          {task.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and assign tasks to your students
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Assign a new task to a student
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select value={taskForm.studentId} onValueChange={(value) => setTaskForm({ ...taskForm, studentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.profile?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>Tasks assigned to your students</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={tasks || []}
            columns={taskColumns}
            searchable
            searchPlaceholder="Search tasks..."
            emptyMessage="No tasks created yet"
          />
        </CardContent>
      </Card>
    </div>
  )
}

