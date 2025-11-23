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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getStatusColor } from '@/lib/utils'

export default function StudentsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    password: '',
    track: 'data_professional',
    batchId: '',
    trainerId: '',
  })

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: async () => {
      const response = await adminApi.getAllStudents()
      return response.data
    },
  })

  const { data: batches } = useQuery({
    queryKey: ['admin', 'batches'],
    queryFn: async () => {
      const response = await adminApi.getAllBatches()
      return response.data
    },
  })

  const { data: trainers } = useQuery({
    queryKey: ['admin', 'trainers'],
    queryFn: async () => {
      const response = await adminApi.getAllTrainers()
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.createStudent(data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Student created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      setIsCreateOpen(false)
      setStudentForm({ fullName: '', email: '', password: '', track: 'data_professional', batchId: '', trainerId: '' })
    },
    onError: () => {
      toast.error('Failed to create student')
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      fullName: studentForm.fullName,
      email: studentForm.email,
      password: studentForm.password,
      track: studentForm.track,
      batchId: studentForm.batchId || undefined,
      trainerId: studentForm.trainerId || undefined,
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

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
      key: 'batch',
      label: 'Batch',
      render: (student: any) => student.batch?.name || 'Not assigned',
    },
    {
      key: 'trainer',
      label: 'Trainer',
      render: (student: any) => student.trainer?.profile?.full_name || 'Not assigned',
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
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage students and their enrollments
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Student</DialogTitle>
              <DialogDescription>
                Add a new student to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="track">Track</Label>
                <Select value={studentForm.track} onValueChange={(value) => setStudentForm({ ...studentForm, track: value })}>
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
                <Label htmlFor="batch">Batch (Optional)</Label>
                <Select value={studentForm.batchId} onValueChange={(value) => setStudentForm({ ...studentForm, batchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches?.batches?.map((batch: any) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trainer">Trainer (Optional)</Label>
                <Select value={studentForm.trainerId} onValueChange={(value) => setStudentForm({ ...studentForm, trainerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers?.trainers?.map((trainer: any) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.profile?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'Creating...' : 'Create Student'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>Manage all students in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={students?.students || []}
            columns={studentColumns}
            searchable
            searchPlaceholder="Search students..."
            emptyMessage="No students found"
          />
        </CardContent>
      </Card>
    </div>
  )
}

