import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getTrackLabel(track: string) {
  return track === 'data_professional' ? 'Data Professional' : 'Full-Stack Developer'
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'warning',
    in_progress: 'default',
    completed: 'success',
    approved: 'success',
    rejected: 'destructive',
    submitted: 'secondary',
    under_review: 'warning',
    locked: 'outline',
    overdue: 'destructive',
    active: 'success',
    inactive: 'secondary',
  }
  return colors[status] || 'default'
}

