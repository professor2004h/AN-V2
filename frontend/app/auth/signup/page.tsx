'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    track: 'data_professional' as 'data_professional' | 'full_stack_dev',
  })
  const [errors, setErrors] = useState<string[]>([])
  const { signUp, isSigningUp, signUpError } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validation
    const newErrors: string[] = []
    if (formData.password.length < 8) {
      newErrors.push('Password must be at least 8 characters')
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match')
    }
    if (!formData.fullName.trim()) {
      newErrors.push('Full name is required')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      role: 'student',
      track: formData.track,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-navy-900 to-navy-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join Apranova LMS and start your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(errors.length > 0 || signUpError) && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {signUpError && <li>{signUpError instanceof Error ? signUpError.message : 'Registration failed'}</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                disabled={isSigningUp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isSigningUp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track">Learning Track</Label>
              <Select
                value={formData.track}
                onValueChange={(value) => setFormData({ ...formData, track: value as any })}
                disabled={isSigningUp}
              >
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isSigningUp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isSigningUp}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSigningUp}>
              {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

