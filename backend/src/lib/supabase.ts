import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Client for user-authenticated requests (uses anon key)
export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  }
);

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types (will be auto-generated from Supabase)
export type UserRole = 'student' | 'trainer' | 'admin' | 'superadmin';
export type TrackType = 'data_professional' | 'full_stack_dev';
export type ProjectStatus = 'locked' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type WorkspaceStatus = 'provisioning' | 'running' | 'stopped' | 'error';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface Student {
  id: string;
  user_id: string;
  track: TrackType;
  batch_id?: string;
  enrollment_date: string;
  trainer_id?: string;
  payment_status: PaymentStatus;
  workspace_url?: string;
  workspace_status: WorkspaceStatus;
  github_username?: string;
  progress_percentage: number;
  current_project_id?: string;
  total_projects_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  track: TrackType;
  project_number: number;
  tech_stack: string[];
  requirements: Record<string, any>;
  starter_code_url?: string;
  documentation_url?: string;
  estimated_hours?: number;
  difficulty_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProject {
  id: string;
  student_id: string;
  project_id: string;
  status: ProjectStatus;
  started_at?: string;
  submitted_at?: string;
  approved_at?: string;
  progress_percentage: number;
  github_repo_url?: string;
  live_demo_url?: string;
  last_commit_sha?: string;
  checkpoints_completed: any[];
  time_spent_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  student_project_id: string;
  student_id: string;
  project_id: string;
  submission_number: number;
  github_repo_url: string;
  live_demo_url?: string;
  commit_sha: string;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewer_id?: string;
  feedback?: string;
  score?: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  student_id: string;
  trainer_id: string;
  project_id?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Trainer {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  specialization?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  name: string;
  track: TrackType;
  start_date: string;
  end_date?: string;
  max_students?: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string;
  metadata: Record<string, any>;
  created_at: string;
  read_at?: string;
}

