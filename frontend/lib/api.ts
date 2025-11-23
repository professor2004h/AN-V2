import axios from 'axios'
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin'
      }
    }
    return Promise.reject(error)
  }
)

// API functions
export const authApi = {
  signUp: (data: { email: string; password: string; fullName: string; role?: string; track?: string }) =>
    api.post('/auth/signup', data),
  signIn: (data: { email: string; password: string }) =>
    api.post('/auth/signin', data),
  getMe: () => api.get('/auth/me'),
  signOut: () => api.post('/auth/signout'),
}

export const studentApi = {
  getMe: () => api.get('/students/me'),
  getProjects: () => api.get('/students/me/projects'),
  getCurrentProject: () => api.get('/students/me/current-project'),
  getTasks: (status?: string) => api.get('/students/me/tasks', { params: { status } }),
  getById: (id: string) => api.get(`/students/${id}`),
  updateProfile: (data: any) => api.patch('/students/me', data),
}

export const projectApi = {
  getAll: (track?: string) => api.get('/projects', { params: { track } }),
  getById: (id: string) => api.get(`/projects/${id}`),
}

export const submissionApi = {
  create: (data: {
    studentProjectId: string
    githubRepoUrl: string
    liveDemoUrl?: string
    commitSha: string
  }) => api.post('/submissions', data),
  getByProject: (studentProjectId: string) =>
    api.get(`/submissions/project/${studentProjectId}`),
}

export const taskApi = {
  getAll: (status?: string, priority?: string) =>
    api.get('/tasks', { params: { status, priority } }),
  create: (data: {
    title: string
    description?: string
    studentId: string
    projectId?: string
    priority?: 'low' | 'medium' | 'high'
    dueDate?: string
  }) => api.post('/tasks', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tasks/${id}/status`, { status }),
}

export const notificationApi = {
  getAll: (unreadOnly?: boolean) =>
    api.get('/notifications', { params: { unreadOnly } }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
}

export const messageApi = {
  send: (data: {
    recipientId: string
    subject?: string
    message: string
    parentMessageId?: string
  }) => api.post('/messages', data),
  getAll: (type?: 'sent' | 'received') =>
    api.get('/messages', { params: { type } }),
}

export const paymentApi = {
  createCheckout: (amount?: number) =>
    api.post('/payments/create-checkout', { amount }),
}

export const trainerApi = {
  getStudents: (filters?: { search?: string; track?: string; status?: string }) =>
    api.get('/trainers/me/students', { params: filters }),
  getStudentDetail: (id: string) =>
    api.get(`/trainers/students/${id}`),
  getPendingSubmissions: () =>
    api.get('/trainers/submissions/pending'),
  reviewSubmission: (id: string, data: { status: string; feedback: string; grade?: number }) =>
    api.post(`/trainers/submissions/${id}/review`, data),
  getStats: () =>
    api.get('/trainers/me/stats'),
}

// Admin API
export const adminApi = {
  // Trainers
  getAllTrainers: (page = 1, limit = 20, search?: string) =>
    api.get('/admin/trainers', { params: { page, limit, search } }),
  getTrainers: (page = 1, limit = 20, search?: string) =>
    api.get('/admin/trainers', { params: { page, limit, search } }),
  createTrainer: (data: { email: string; password: string; fullName: string; specialization?: string }) =>
    api.post('/admin/trainers', data),
  updateTrainer: (id: string, data: any) =>
    api.patch(`/admin/trainers/${id}`, data),
  deleteTrainer: (id: string) =>
    api.delete(`/admin/trainers/${id}`),

  // Students
  getAllStudents: (page = 1, limit = 20, filters?: any) =>
    api.get('/admin/students', { params: { page, limit, ...filters } }),
  getStudents: (page = 1, limit = 20, filters?: any) =>
    api.get('/admin/students', { params: { page, limit, ...filters } }),
  createStudent: (data: { email: string; password: string; fullName: string; track: string; batchId?: string; trainerId?: string }) =>
    api.post('/admin/students', data),
  updateStudent: (id: string, data: any) =>
    api.patch(`/admin/students/${id}`, data),
  assignStudentToTrainer: (studentId: string, trainerId: string) =>
    api.post(`/admin/students/${studentId}/assign-trainer`, { trainerId }),

  // Batches
  getAllBatches: (page = 1, limit = 20) =>
    api.get('/admin/batches', { params: { page, limit } }),
  getBatches: (page = 1, limit = 20) =>
    api.get('/admin/batches', { params: { page, limit } }),
  createBatch: (data: { name: string; startDate: string; endDate?: string; maxStudents?: number }) =>
    api.post('/admin/batches', data),
  updateBatch: (id: string, data: any) =>
    api.patch(`/admin/batches/${id}`, data),

  // Projects
  getProjects: (page = 1, limit = 20) =>
    api.get('/admin/projects', { params: { page, limit } }),
  createProject: (data: any) =>
    api.post('/admin/projects', data),
  updateProject: (id: string, data: any) =>
    api.patch(`/admin/projects/${id}`, data),

  // Stats
  getSystemStats: () =>
    api.get('/admin/stats'),
  getStats: () =>
    api.get('/admin/stats'),
};

// Super Admin API
export const superadminApi = {
  // Revenue
  getRevenueStats: (startDate?: string, endDate?: string) =>
    api.get('/superadmin/revenue', { params: { startDate, endDate } }),

  // Payments
  getAllPayments: (page = 1, limit = 20, filters?: any) =>
    api.get('/superadmin/payments', { params: { page, limit, ...filters } }),
  getPaymentById: (id: string) =>
    api.get(`/superadmin/payments/${id}`),
  exportPayments: (format: 'csv' | 'pdf', filters?: any) =>
    api.get(`/superadmin/payments/export/${format}`, { params: filters, responseType: 'blob' }),

  // Financial Analytics
  getFinancialAnalytics: () =>
    api.get('/superadmin/financial-analytics'),

  // Admin Management
  createAdmin: (data: { email: string; password: string; fullName: string }) =>
    api.post('/superadmin/admins', data),
  deleteAdmin: (userId: string) =>
    api.delete(`/superadmin/admins/${userId}`),
};

// Workspace API
export const workspaceApi = {
  provision: (studentId?: string) =>
    api.post('/workspaces/provision', studentId ? { studentId } : {}),
  getWorkspace: (studentId: string) =>
    api.get(`/workspaces/${studentId}`),
  startWorkspace: (studentId: string) =>
    api.post(`/workspaces/${studentId}/start`),
  stopWorkspace: (studentId: string) =>
    api.post(`/workspaces/${studentId}/stop`),
  deleteWorkspace: (studentId: string) =>
    api.delete(`/workspaces/${studentId}`),
  heartbeat: (studentId?: string) =>
    api.post('/workspaces/heartbeat', studentId ? { studentId } : {}),
};

// Enhanced Submission API
export const enhancedSubmissionApi = {
  ...submissionApi,
  getPending: () =>
    api.get('/submissions/pending'),
  reviewSubmission: (id: string, data: { status: string; feedback: string; grade?: number }) =>
    api.post(`/submissions/${id}/review`, data),
};

