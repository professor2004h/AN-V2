import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { AppError } from '../middleware/errorHandler';

export class StudentService {
  async getStudentByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        profile:profiles!students_user_id_fkey(id, email, full_name, avatar_url),
        batch:batches(id, name, track, start_date, end_date),
        trainer:trainers(id, specialization, profile:profiles!trainers_user_id_fkey(id, full_name, email))
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch student', { userId, error });
      throw new AppError(404, 'Student not found');
    }

    return data;
  }

  async getStudentById(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        profile:profiles!students_user_id_fkey(id, email, full_name, avatar_url, phone),
        batch:batches(id, name, track, start_date, end_date),
        trainer:trainers(id, specialization, profile:profiles!trainers_user_id_fkey(id, full_name, email))
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      logger.error('Failed to fetch student', { studentId, error });
      throw new AppError(404, 'Student not found');
    }

    return data;
  }

  async getStudentProjects(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('student_projects')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch student projects', { studentId, error });
      throw new AppError(500, 'Failed to fetch projects');
    }

    return data;
  }

  async getCurrentProject(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('student_projects')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Failed to fetch current project', { studentId, error });
      throw new AppError(500, 'Failed to fetch current project');
    }

    return data;
  }

  async getStudentTasks(studentId: string, status?: string) {
    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        trainer:profiles!tasks_trainer_id_fkey(id, full_name, avatar_url),
        project:projects(id, title, track)
      `)
      .eq('student_id', studentId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch student tasks', { studentId, error });
      throw new AppError(500, 'Failed to fetch tasks');
    }

    return data;
  }

  async updateStudentProgress(studentId: string, progressPercentage: number) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .update({ progress_percentage: progressPercentage })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update student progress', { studentId, error });
      throw new AppError(500, 'Failed to update progress');
    }

    return data;
  }

  async updateWorkspaceStatus(studentId: string, status: string, workspaceUrl?: string) {
    const updateData: any = { workspace_status: status };
    if (workspaceUrl) {
      updateData.workspace_url = workspaceUrl;
    }

    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updateData)
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update workspace status', { studentId, error });
      throw new AppError(500, 'Failed to update workspace status');
    }

    return data;
  }

  async getStudentsByTrainer(trainerId: string) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        profile:profiles!students_user_id_fkey(id, email, full_name, avatar_url),
        batch:batches(id, name, track)
      `)
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch trainer students', { trainerId, error });
      throw new AppError(500, 'Failed to fetch students');
    }

    return data;
  }
}

export const studentService = new StudentService();

