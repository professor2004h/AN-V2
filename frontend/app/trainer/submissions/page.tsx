'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trainerApi, submissionApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileCheck, Github, Globe, GitCommit, ThumbsUp, ThumbsDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function SubmissionsPage() {
  const queryClient = useQueryClient()
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [reviewForm, setReviewForm] = useState({ feedback: '', grade: '' })

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['trainer', 'submissions', 'pending'],
    queryFn: async () => {
      const response = await trainerApi.getPendingSubmissions()
      return response.data
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ submissionId, status, feedback, grade }: any) => {
      const response = await trainerApi.reviewSubmission(submissionId, {
        status,
        feedback,
        grade: grade ? parseInt(grade) : undefined,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Submission reviewed successfully')
      queryClient.invalidateQueries({ queryKey: ['trainer', 'submissions'] })
      setSelectedSubmission(null)
      setReviewForm({ feedback: '', grade: '' })
    },
    onError: () => {
      toast.error('Failed to review submission')
    },
  })

  const handleReview = (status: 'approved' | 'rejected') => {
    if (!selectedSubmission) return
    
    if (status === 'approved' && !reviewForm.grade) {
      toast.error('Please provide a grade for approved submissions')
      return
    }

    reviewMutation.mutate({
      submissionId: selectedSubmission.id,
      status,
      feedback: reviewForm.feedback,
      grade: reviewForm.grade,
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submission Review Queue</h1>
        <p className="text-muted-foreground mt-2">
          Review and provide feedback on student submissions
        </p>
      </div>

      {submissions && submissions.length > 0 ? (
        <div className="grid gap-6">
          {submissions.map((submission: any) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{submission.student_project?.student?.profile?.full_name}</CardTitle>
                    <CardDescription>
                      {submission.student_project?.project?.title} - Submission #{submission.submission_number}
                    </CardDescription>
                  </div>
                  <Badge variant="warning">Pending Review</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Github className="h-4 w-4" />
                    <a
                      href={submission.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {submission.github_repo_url}
                    </a>
                  </div>
                  {submission.live_demo_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4" />
                      <a
                        href={submission.live_demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {submission.live_demo_url}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <GitCommit className="h-4 w-4" />
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {submission.commit_sha}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {formatDate(submission.created_at)}
                  </p>
                </div>

                <Button onClick={() => setSelectedSubmission(submission)}>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Review Submission
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck}
          title="No pending submissions"
          description="All submissions have been reviewed. Great job!"
        />
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Provide feedback and grade for {selectedSubmission?.student_project?.student?.profile?.full_name}'s submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide detailed feedback on the submission..."
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                placeholder="85"
                value={reviewForm.grade}
                onChange={(e) => setReviewForm({ ...reviewForm, grade: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleReview('approved')}
                disabled={reviewMutation.isPending}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReview('rejected')}
                disabled={reviewMutation.isPending}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

