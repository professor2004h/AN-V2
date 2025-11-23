'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { studentApi, submissionApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Github, Globe, GitCommit, Send } from 'lucide-react'
import { toast } from 'sonner'
import { getStatusColor, formatDate } from '@/lib/utils'

export default function ProjectDetailPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const [submissionForm, setSubmissionForm] = useState({
    githubRepoUrl: '',
    liveDemoUrl: '',
    commitSha: '',
  })

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ['student', 'project', params.id],
    queryFn: async () => {
      const response = await studentApi.getProjects()
      const projects = response.data
      return projects.find((p: any) => p.id === params.id)
    },
  })

  // Fetch submissions
  const { data: submissions } = useQuery({
    queryKey: ['submissions', params.id],
    queryFn: async () => {
      const response = await submissionApi.getByProject(params.id as string)
      return response.data
    },
    enabled: !!params.id,
  })

  // Submit project mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await submissionApi.create({
        studentProjectId: params.id as string,
        ...data,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Project submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['submissions', params.id] })
      queryClient.invalidateQueries({ queryKey: ['student', 'projects'] })
      setSubmissionForm({ githubRepoUrl: '', liveDemoUrl: '', commitSha: '' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit project')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate(submissionForm)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  const canSubmit = project.status === 'in_progress' || project.status === 'rejected'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{project.project?.title}</h1>
          <Badge variant={getStatusColor(project.status) as any} className="text-sm">
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2">{project.project?.description}</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="submit">Submit Project</TabsTrigger>
          <TabsTrigger value="submissions">Submission History</TabsTrigger>
        </TabsList>

        {/* Project Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              {project.project?.requirements ? (
                <div className="prose dark:prose-invert max-w-none">
                  {typeof project.project.requirements === 'string' ? (
                    <p>{project.project.requirements}</p>
                  ) : (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(project.project.requirements, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No requirements specified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tech Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.project?.tech_stack?.map((tech: string) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submit Project Tab */}
        <TabsContent value="submit" className="space-y-6">
          {canSubmit ? (
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Project</CardTitle>
                <CardDescription>
                  Provide your GitHub repository URL and live demo link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="githubRepoUrl">
                      <Github className="inline h-4 w-4 mr-2" />
                      GitHub Repository URL *
                    </Label>
                    <Input
                      id="githubRepoUrl"
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={submissionForm.githubRepoUrl}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, githubRepoUrl: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liveDemoUrl">
                      <Globe className="inline h-4 w-4 mr-2" />
                      Live Demo URL (Optional)
                    </Label>
                    <Input
                      id="liveDemoUrl"
                      type="url"
                      placeholder="https://your-demo.com"
                      value={submissionForm.liveDemoUrl}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, liveDemoUrl: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commitSha">
                      <GitCommit className="inline h-4 w-4 mr-2" />
                      Commit SHA *
                    </Label>
                    <Input
                      id="commitSha"
                      placeholder="abc123def456"
                      value={submissionForm.commitSha}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, commitSha: e.target.value })}
                      required
                      minLength={7}
                    />
                    <p className="text-xs text-muted-foreground">
                      The commit hash of your final submission
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Project
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>
                {project.status === 'locked' && 'This project is locked. Complete the previous project first.'}
                {project.status === 'submitted' && 'Your submission is under review.'}
                {project.status === 'approved' && 'This project has been approved!'}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Submission History Tab */}
        <TabsContent value="submissions" className="space-y-4">
          {submissions && submissions.length > 0 ? (
            submissions.map((submission: any) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Submission #{submission.submission_number}
                    </CardTitle>
                    <Badge variant={getStatusColor(submission.status) as any}>
                      {submission.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Submitted on {formatDate(submission.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
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
                  </div>

                  {submission.feedback && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Trainer Feedback</p>
                        <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                      </div>
                    </>
                  )}

                  {submission.grade && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        Grade: <span className="text-green-600">{submission.grade}/100</span>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No submissions yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

