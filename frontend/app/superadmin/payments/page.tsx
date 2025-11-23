'use client'

import { useQuery } from '@tanstack/react-query'
import { superadminApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { DataTable } from '@/components/shared/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'
import { toast } from 'sonner'

export default function PaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['superadmin', 'payments'],
    queryFn: async () => {
      const response = await superadminApi.getAllPayments()
      return response.data
    },
  })

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await superadminApi.exportPayments(format)
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `payments-${new Date().toISOString().split('T')[0]}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(`Payments exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Failed to export payments')
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const paymentColumns = [
    {
      key: 'student',
      label: 'Student',
      render: (payment: any) => (
        <div>
          <p className="font-medium">{payment.student?.profile?.full_name}</p>
          <p className="text-sm text-muted-foreground">{payment.student?.profile?.email}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (payment: any) => (
        <span className="font-medium">${payment.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (payment: any) => (
        <Badge variant={getStatusColor(payment.status) as any}>
          {payment.status}
        </Badge>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (payment: any) => (
        <span className="text-sm">{payment.payment_method || 'Stripe'}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (payment: any) => formatDate(payment.created_at),
    },
    {
      key: 'stripe',
      label: 'Stripe ID',
      render: (payment: any) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {payment.stripe_payment_id || 'N/A'}
        </code>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all payment transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>Complete payment transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={payments || []}
            columns={paymentColumns}
            searchable
            searchPlaceholder="Search payments..."
            emptyMessage="No payments found"
          />
        </CardContent>
      </Card>
    </div>
  )
}

