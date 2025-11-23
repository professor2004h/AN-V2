import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';
import { validateBody } from '../middleware/validation';
import { notificationService } from '../services/notificationService';

const router = Router();

router.use(authenticate);

const createSubmissionSchema = z.object({
  studentProjectId: z.string().uuid(),
  githubRepoUrl: z.string().url(),
  liveDemoUrl: z.string().url().optional(),
  commitSha: z.string().min(7),
});

// Create submission
router.post('/', validateBody(createSubmissionSchema), async (req: AuthRequest, res, next) => {
  try {
    const { studentProjectId, githubRepoUrl, liveDemoUrl, commitSha } = req.body;
    
    // Get student project details
    const { data: studentProject, error: spError } = await supabaseAdmin
      .from('student_projects')
      .select('student_id, project_id')
      .eq('id', studentProjectId)
      .single();
    
    if (spError) throw spError;
    
    // Get submission number
    const { count } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_project_id', studentProjectId);
    
    const submissionNumber = (count || 0) + 1;
    
    // Create submission
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        student_project_id: studentProjectId,
        student_id: studentProject.student_id,
        project_id: studentProject.project_id,
        submission_number: submissionNumber,
        github_repo_url: githubRepoUrl,
        live_demo_url: liveDemoUrl,
        commit_sha: commitSha,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update student project status
    await supabaseAdmin
      .from('student_projects')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        github_repo_url: githubRepoUrl,
        live_demo_url: liveDemoUrl,
        last_commit_sha: commitSha,
      })
      .eq('id', studentProjectId);
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Get submissions for a student project
router.get('/project/:studentProjectId', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        reviewer:profiles!submissions_reviewer_id_fkey(id, full_name, avatar_url)
      `)
      .eq('student_project_id', req.params.studentProjectId)
      .order('submission_number', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get pending submissions for trainer
router.get('/pending', async (req: AuthRequest, res, next) => {
  try {
    // Get trainer's students
    const { data: trainer } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', req.user!.id)
      .single();

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

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

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Review submission (approve/reject)
const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'needs_revision']),
  feedback: z.string().min(10),
  grade: z.number().min(0).max(100).optional(),
});

router.post('/:id/review', validateBody(reviewSchema), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, feedback, grade } = req.body;

    // Get submission with project details
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        student:students!submissions_student_id_fkey(user_id),
        project:projects(title),
        student_project:student_projects(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update submission
    const { data: updatedSubmission, error } = await supabaseAdmin
      .from('submissions')
      .update({
        status,
        feedback,
        grade,
        reviewer_id: req.user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update student project status
    const newProjectStatus = status === 'approved' ? 'approved' :
                             status === 'rejected' ? 'rejected' : 'under_review';

    await supabaseAdmin
      .from('student_projects')
      .update({
        status: newProjectStatus,
        grade: status === 'approved' ? grade : null,
      })
      .eq('id', submission.student_project_id);

    // Send notification to student
    await notificationService.notifySubmissionReviewed(
      submission.student.user_id,
      status,
      feedback,
      submission.project.title
    );

    // If approved, unlock next project
    if (status === 'approved') {
      const { data: nextProject } = await supabaseAdmin
        .from('student_projects')
        .select('*, project:projects(title)')
        .eq('student_id', submission.student_id)
        .eq('status', 'locked')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (nextProject) {
        await supabaseAdmin
          .from('student_projects')
          .update({ status: 'in_progress' })
          .eq('id', nextProject.id);

        await notificationService.notifyProjectUnlocked(
          submission.student.user_id,
          nextProject.project.title
        );
      }
    }

    res.json(updatedSubmission);
  } catch (error) {
    next(error);
  }
});

export default router;

