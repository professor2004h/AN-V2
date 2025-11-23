'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Github, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { getTrackLabel } from '@/lib/utils'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', 'me'],
    queryFn: async () => {
      const response = await studentApi.getMe()
      return response.data
    },
  })

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    githubUsername: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Initialize form when student data loads
  useState(() => {
    if (student) {
      setProfileForm({
        fullName: student.profile?.full_name || '',
        githubUsername: student.github_username || '',
      })
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await studentApi.updateProfile(data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['student', 'me'] })
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate({
      full_name: profileForm.fullName,
      github_username: profileForm.githubUsername,
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    // Password update would go here
    toast.success('Password updated successfully')
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={student?.profile?.email || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubUsername">
                <Github className="inline h-4 w-4 mr-2" />
                GitHub Username
              </Label>
              <Input
                id="githubUsername"
                value={profileForm.githubUsername}
                onChange={(e) => setProfileForm({ ...profileForm, githubUsername: e.target.value })}
                placeholder="your-github-username"
              />
            </div>

            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Learning Track</p>
              <p className="text-sm text-muted-foreground">
                {getTrackLabel(student?.track)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Batch</p>
              <p className="text-sm text-muted-foreground">
                {student?.batch?.name || 'Not assigned'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Trainer</p>
              <p className="text-sm text-muted-foreground">
                {student?.trainer?.profile?.full_name || 'Not assigned'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <p className="text-sm font-medium">Payment Status</p>
            </div>
            <Badge variant={student?.payment_status === 'completed' ? 'success' : 'warning'}>
              {student?.payment_status || 'pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

