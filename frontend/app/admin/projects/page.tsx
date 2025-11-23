'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
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
import { toast } from 'sonner'

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    track: 'data_professional',
    order: '1',
  })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: async () => {
      const response = await adminApi.getProjects()
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.createProject(data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Project created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] })
      setIsCreateOpen(false)
      setProjectForm({ title: '', description: '', track: 'data_professional', order: '1' })
    },
    onError: () => {
      toast.error('Failed to create project')
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      title: projectForm.title,
      description: projectForm.description,
      track: projectForm.track,
      order: parseInt(projectForm.order),
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const projectColumns = [
    {
      key: 'title',
      label: 'Project',
      render: (project: any) => (
        <div>
          <p className="font-medium">{project.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
        </div>
      ),
    },
    {
      key: 'track',
      label: 'Track',
      render: (project: any) => (
        <Badge variant="outline">
          {project.track === 'data_professional' ? 'Data Professional' : 'Full-Stack Dev'}
        </Badge>
      ),
    },
    {
      key: 'order',
      label: 'Order',
      render: (project: any) => <span className="font-medium">#{project.order}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage projects for both tracks
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="track">Track</Label>
                <Select value={projectForm.track} onValueChange={(value) => setProjectForm({ ...projectForm, track: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_professional">Data Professional</SelectItem>
                    <SelectItem value="full_stack_dev">Full-Stack Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Select value={projectForm.order} onValueChange={(value) => setProjectForm({ ...projectForm, order: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Project 1</SelectItem>
                    <SelectItem value="2">Project 2</SelectItem>
                    <SelectItem value="3">Project 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Manage all projects in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={projects || []}
            columns={projectColumns}
            searchable
            searchPlaceholder="Search projects..."
            emptyMessage="No projects found"
          />
        </CardContent>
      </Card>
    </div>
  )
}

