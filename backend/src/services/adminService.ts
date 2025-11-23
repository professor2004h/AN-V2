import { supabaseAdmin } from '../lib/supabase';
import type { Profile, Student, Trainer, Batch, Project } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export class AdminService {
  // ==================== USER CREATION ====================

  async createUserWithRole(data: {
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'trainer' | 'admin' | 'superadmin';
  }) {
    // Check if user already exists in auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = users.find(u => u.email === data.email);

    if (existingAuthUser) {
      // User exists in auth, check if profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select()
        .eq('id', existingAuthUser.id)
        .single();

      if (existingProfile) {
        // User fully exists, return existing user
        return { user: existingAuthUser, profile: existingProfile };
      } else {
        // Auth user exists but no profile, create profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingAuthUser.id,
            email: data.email,
            full_name: data.fullName,
            role: data.role,
            is_active: true,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        return { user: existingAuthUser, profile };
      }
    }

    // Create new auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    return { user: authUser.user, profile };
  }

  // ==================== TRAINER MANAGEMENT ====================

  async getAllTrainers(page = 1, limit = 20, search?: string) {
    let query = supabaseAdmin
      .from('trainers')
      .select(`
        *,
        profile:profiles!trainers_user_id_fkey(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { trainers: data, total: count || 0 };
  }

  async createTrainer(data: {
    email: string;
    password: string;
    fullName: string;
    specialization?: string;
  }) {
    // Create user with trainer role
    const { user, profile } = await this.createUserWithRole({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: 'trainer',
    });

    // Create trainer record
    const { data: trainer, error } = await supabaseAdmin
      .from('trainers')
      .insert({
        user_id: user.id,
        specialization: data.specialization,
      })
      .select(`
        *,
        profile:profiles(*)
      `)
      .single();

    if (error) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw error;
    }

    return trainer;
  }

  async updateTrainer(trainerId: string, updates: Partial<Trainer>) {
    const { data, error } = await supabaseAdmin
      .from('trainers')
      .update(updates)
      .eq('id', trainerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTrainer(trainerId: string) {
    const { error } = await supabaseAdmin
      .from('trainers')
      .update({ is_active: false })
      .eq('id', trainerId);

    if (error) throw error;
    return { success: true };
  }

  // ==================== STUDENT MANAGEMENT ====================

  async getAllStudents(page = 1, limit = 20, filters?: {
    search?: string;
    track?: string;
    batchId?: string;
    trainerId?: string;
  }) {
    let query = supabaseAdmin
      .from('students')
      .select(`
        *,
        profile:profiles!students_user_id_fkey(*),
        batch:batches(*),
        trainer:trainers(*, profile:profiles!trainers_user_id_fkey(*))
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(`profile.full_name.ilike.%${filters.search}%,profile.email.ilike.%${filters.search}%`);
    }
    if (filters?.track) {
      query = query.eq('track', filters.track);
    }
    if (filters?.batchId) {
      query = query.eq('batch_id', filters.batchId);
    }
    if (filters?.trainerId) {
      query = query.eq('trainer_id', filters.trainerId);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { students: data, total: count || 0 };
  }

  async createStudent(data: {
    email: string;
    password: string;
    fullName: string;
    track: 'data_professional' | 'full_stack_dev';
    batchId?: string | null;
    trainerId?: string | null;
  }) {
    // Create user with student role (or get existing)
    const { user, profile } = await this.createUserWithRole({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: 'student',
    });

    // Check if student record already exists
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        profile:profiles(*),
        batch:batches(*),
        trainer:trainers(*, profile:profiles!trainers_user_id_fkey(*))
      `)
      .eq('user_id', user.id)
      .single();

    if (existingStudent) {
      // Student record exists, ensure projects are initialized
      const { count } = await supabaseAdmin
        .from('student_projects')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', existingStudent.id);

      if (count === 0) {
        await this.initializeStudentProjects(existingStudent.id, existingStudent.track);
      }

      return existingStudent;
    }

    // Create student record (convert null to undefined for Supabase)
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: user.id,
        track: data.track,
        batch_id: data.batchId || undefined,
        trainer_id: data.trainerId || undefined,
      })
      .select(`
        *,
        profile:profiles(*),
        batch:batches(*),
        trainer:trainers(*, profile:profiles!trainers_user_id_fkey(*))
      `)
      .single();

    if (error) {
      // Don't rollback auth user if it already existed
      throw error;
    }

    // Initialize student projects based on track
    await this.initializeStudentProjects(student.id, data.track);

    return student;
  }

  private async initializeStudentProjects(studentId: string, track: string) {
    // Get all projects for the student's track
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, order_index')
      .eq('track', track)
      .order('order_index', { ascending: true });

    if (error) throw error;

    // Create student_projects for each project
    const studentProjects = projects.map((project, index) => ({
      student_id: studentId,
      project_id: project.id,
      status: index === 0 ? 'in_progress' : 'locked', // First project is unlocked
      progress_percentage: 0,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('student_projects')
      .insert(studentProjects);

    if (insertError) throw insertError;
  }

  async updateStudent(studentId: string, updates: Partial<Student>) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async assignStudentToTrainer(studentId: string, trainerId: string) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .update({ trainer_id: trainerId })
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== BATCH MANAGEMENT ====================

  async getAllBatches(page = 1, limit = 20) {
    const { data, error, count } = await supabaseAdmin
      .from('batches')
      .select('*, _count:students(count)', { count: 'exact' })
      .order('start_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { batches: data, total: count || 0 };
  }

  async createBatch(data: {
    name: string;
    track: 'data_professional' | 'full_stack_dev';
    startDate: string;
    endDate?: string;
    maxStudents?: number;
  }) {
    const { data: batch, error } = await supabaseAdmin
      .from('batches')
      .insert({
        name: data.name,
        track: data.track,
        start_date: data.startDate,
        end_date: data.endDate,
        max_students: data.maxStudents,
      })
      .select()
      .single();

    if (error) throw error;
    return batch;
  }

  async updateBatch(batchId: string, updates: Partial<Batch>) {
    const { data, error } = await supabaseAdmin
      .from('batches')
      .update(updates)
      .eq('id', batchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== SYSTEM STATISTICS ====================

  async getSystemStats() {
    // Get counts
    const [studentsResult, trainersResult, batchesResult, projectsResult] = await Promise.all([
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('trainers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('batches').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
    ]);

    // Get active students (with in_progress projects)
    const { count: activeStudents } = await supabaseAdmin
      .from('student_projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    // Get pending submissions
    const { count: pendingSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: recentEnrollments } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      totalStudents: studentsResult.count || 0,
      totalTrainers: trainersResult.count || 0,
      totalBatches: batchesResult.count || 0,
      totalProjects: projectsResult.count || 0,
      activeStudents: activeStudents || 0,
      pendingSubmissions: pendingSubmissions || 0,
      recentEnrollments: recentEnrollments || 0,
    };
  }

  // ==================== PROJECT MANAGEMENT ====================

  async getAllProjects(page = 1, limit = 20) {
    const { data, error, count } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact' })
      .order('order_index', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { projects: data, total: count || 0 };
  }

  async createProject(data: {
    title: string;
    description: string;
    track: 'data_professional' | 'full_stack_dev';
    orderIndex: number;
    requirements?: any;
    techStack?: string[];
  }) {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        title: data.title,
        description: data.description,
        track: data.track,
        order_index: data.orderIndex,
        requirements: data.requirements,
        tech_stack: data.techStack,
      })
      .select()
      .single();

    if (error) throw error;
    return project;
  }

  async updateProject(projectId: string, updates: Partial<Project>) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const adminService = new AdminService();

