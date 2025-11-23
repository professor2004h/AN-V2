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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export default function BatchesPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [batchForm, setBatchForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
  })

  const { data: batches, isLoading } = useQuery({
    queryKey: ['admin', 'batches'],
    queryFn: async () => {
      const response = await adminApi.getAllBatches()
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.createBatch(data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Batch created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'batches'] })
      setIsCreateOpen(false)
      setBatchForm({ name: '', startDate: '', endDate: '' })
    },
    onError: () => {
      toast.error('Failed to create batch')
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      name: batchForm.name,
      start_date: batchForm.startDate,
      end_date: batchForm.endDate,
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const batchColumns = [
    {
      key: 'name',
      label: 'Batch Name',
      render: (batch: any) => <span className="font-medium">{batch.name}</span>,
    },
    {
      key: 'dates',
      label: 'Duration',
      render: (batch: any) => (
        <div className="text-sm">
          <p>{formatDate(batch.start_date)} - {formatDate(batch.end_date)}</p>
        </div>
      ),
    },
    {
      key: 'students',
      label: 'Students',
      render: (batch: any) => (
        <Badge variant="outline">
          {batch.students?.length || 0} students
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage batches and their schedules
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Add a new batch to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name</Label>
                <Input
                  id="name"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g., Batch 2024-Q1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={batchForm.startDate}
                  onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={batchForm.endDate}
                  onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
                />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>Manage all batches in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={batches?.batches || []}
            columns={batchColumns}
            searchable
            searchPlaceholder="Search batches..."
            emptyMessage="No batches found"
          />
        </CardContent>
      </Card>
    </div>
  )
}
