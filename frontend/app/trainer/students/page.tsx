'use client'

import { useQuery } from '@tanstack/react-query'
import { trainerApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { DataTable } from '@/components/shared/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function TrainerStudentsPage() {
    const { data: students, isLoading } = useQuery({
        queryKey: ['trainer', 'students'],
        queryFn: async () => {
            const response = await trainerApi.getStudents()
            return response.data
        },
    })

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
            key: 'progress',
            label: 'Progress',
            render: (student: any) => {
                const completedProjects = student.student_projects?.filter((sp: any) => sp.status === 'completed').length || 0
                const totalProjects = student.student_projects?.length || 0
                return `${completedProjects}/${totalProjects} projects`
            },
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (student: any) => (
                <Link href={`/trainer/students/${student.id}`}>
                    <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                    </Button>
                </Link>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Students</h1>
                <p className="text-muted-foreground mt-2">
                    Manage and track your assigned students
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Students</CardTitle>
                    <CardDescription>Students assigned to you</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={students || []}
                        columns={studentColumns}
                        searchable
                        searchPlaceholder="Search students..."
                        emptyMessage="No students assigned to you yet"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
