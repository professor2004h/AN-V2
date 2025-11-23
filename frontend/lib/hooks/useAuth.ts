'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authApi } from '@/lib/api'
import type { Profile, UserRole } from '@/lib/supabase'

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Get current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const response = await authApi.getMe()
      return response.data as Profile
    },
    retry: false,
  })

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      const user = await queryClient.fetchQuery({ queryKey: ['auth', 'me'] })
      redirectByRole((user as Profile)?.role)
    },
  })

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async (data: {
      email: string
      password: string
      fullName: string
      role?: string
      track?: string
    }) => {
      const response = await authApi.signUp(data)
      return response.data
    },
    onSuccess: () => {
      router.push('/auth/signin?registered=true')
    },
  })

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut()
      await authApi.signOut()
    },
    onSuccess: () => {
      queryClient.clear()
      router.push('/auth/signin')
    },
  })

  // Redirect based on role
  const redirectByRole = (role?: UserRole) => {
    if (!role) return

    const roleRoutes: Record<UserRole, string> = {
      student: '/student',
      trainer: '/trainer',
      admin: '/admin',
      superadmin: '/superadmin',
    }

    router.push(roleRoutes[role] || '/')
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
  }
}

