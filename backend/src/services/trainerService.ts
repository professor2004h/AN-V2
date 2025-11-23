import { supabaseAdmin } from '../lib/supabase';

export class TrainerService {
  // ==================== STUDENT MANAGEMENT ====================

  async getTrainerStudents(trainerId: string, filters?: {
    search?: string;
    track?: string;
    status?: string;
  }) {
    // Get trainer record
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', trainerId)
      .single();

    if (trainerError) throw trainerError;

    let query = supabaseAdmin
      .from('students')
      .select(`
        *,
        profile:profiles(*),
        batch:batches(*),
        student_projects:student_projects(
          *,
          project:projects(*)
        )
      `)
      .eq('trainer_id', trainer.id)
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(`profile.full_name.ilike.%${filters.search}%,profile.email.ilike.%${filters.search}%`);
    }
    if (filters?.track) {
      query = query.eq('track', filters.track);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getStudentDetail(trainerId: string, studentId: string) {
    // Verify student belongs to trainer
    const { data: trainer } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', trainerId)
      .single();

    if (!trainer) throw new Error('Trainer not found');

    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        profile:profiles(*),
        batch:batches(*),
        trainer:trainers(*, profile:profiles(*)),
        student_projects:student_projects(
          *,
          project:projects(*),
          submissions:submissions(count)
        ),
        tasks:tasks(
          *,
          project:projects(*)
        )
      `)
      .eq('id', studentId)
      .eq('trainer_id', trainer.id)
      .single();

    if (error) throw error;
    return student;
  }

  // ==================== SUBMISSION MANAGEMENT ====================

  async getPendingSubmissions(trainerId: string) {
    // Get trainer record
    const { data: trainer } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', trainerId)
      .single();

    if (!trainer) throw new Error('Trainer not found');

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        student:students!submissions_student_id_fkey(
          *,
          profile:profiles(*)
        ),
        project:projects(*),
        student_project:student_projects(*)
      `)
      .eq('status', 'pending')
      .eq('student.trainer_id', trainer.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async reviewSubmission(
    trainerId: string,
    submissionId: string,
    review: {
      status: 'approved' | 'rejected' | 'needs_revision';
      feedback: string;
      grade?: number;
    }
  ) {
    // Verify submission belongs to trainer's student
    const { data: submission } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        student:students!submissions_student_id_fkey(trainer_id)
      `)
      .eq('id', submissionId)
      .single();

    if (!submission) throw new Error('Submission not found');

    const { data: trainer } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', trainerId)
      .single();

    if (!trainer || submission.student.trainer_id !== trainer.id) {
      throw new Error('Unauthorized: This submission does not belong to your students');
    }

    // Update submission
    const { data: updatedSubmission, error } = await supabaseAdmin
      .from('submissions')
      .update({
        status: review.status,
        feedback: review.feedback,
        grade: review.grade,
        reviewer_id: trainerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    // Update student project status
    const newProjectStatus = review.status === 'approved' ? 'approved' :
                             review.status === 'rejected' ? 'rejected' : 'under_review';

    await supabaseAdmin
      .from('student_projects')
      .update({
        status: newProjectStatus,
        grade: review.status === 'approved' ? review.grade : null,
      })
      .eq('id', submission.student_project_id);

    return updatedSubmission;
  }
}

export const trainerService = new TrainerService();

