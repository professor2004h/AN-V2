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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TrainersPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [trainerForm, setTrainerForm] = useState({
    fullName: '',
    email: '',
    password: '',
    specialization: '',
  })

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['admin', 'trainers'],
    queryFn: async () => {
      const response = await adminApi.getAllTrainers()
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.createTrainer(data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Trainer created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'trainers'] })
      setIsCreateOpen(false)
      setTrainerForm({ fullName: '', email: '', password: '', specialization: '' })
    },
    onError: () => {
      toast.error('Failed to create trainer')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (trainerId: string) => {
      const response = await adminApi.deleteTrainer(trainerId)
      return response.data
    },
    onSuccess: () => {
      toast.success('Trainer deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'trainers'] })
    },
    onError: () => {
      toast.error('Failed to delete trainer')
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      fullName: trainerForm.fullName,
      email: trainerForm.email,
      password: trainerForm.password,
      specialization: trainerForm.specialization,
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const trainerColumns = [
    {
      key: 'name',
      label: 'Trainer',
      render: (trainer: any) => (
        <div>
          <p className="font-medium">{trainer.profile?.full_name}</p>
          <p className="text-sm text-muted-foreground">{trainer.profile?.email}</p>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (trainer: any) => trainer.specialization || 'N/A',
    },
    {
      key: 'students',
      label: 'Students',
      render: (trainer: any) => (
        <Badge variant="outline">
          {trainer.students?.length || 0} students
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (trainer: any) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm('Are you sure you want to delete this trainer?')) {
              deleteMutation.mutate(trainer.id)
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trainer Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage trainers and their assignments
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Trainer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Trainer</DialogTitle>
              <DialogDescription>
                Add a new trainer to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={trainerForm.fullName}
                  onChange={(e) => setTrainerForm({ ...trainerForm, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={trainerForm.password}
                  onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={trainerForm.specialization}
                  onChange={(e) => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                  placeholder="e.g., Data Science, Full-Stack Development"
                />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'Creating...' : 'Create Trainer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trainers</CardTitle>
          <CardDescription>Manage all trainers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={trainers?.trainers || []}
            columns={trainerColumns}
            searchable
            searchPlaceholder="Search trainers..."
            emptyMessage="No trainers found"
          />
        </CardContent>
      </Card>
    </div>
  )
}

