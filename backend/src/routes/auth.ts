import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { validateBody } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['student', 'trainer', 'admin', 'superadmin']).default('student'),
  track: z.enum(['data_professional', 'full_stack_dev']).optional(),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Sign up
router.post('/signup', validateBody(signUpSchema), async (req, res, next) => {
  try {
    const { email, password, fullName, role, track } = req.body;

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      logger.error('Failed to create auth user', { error: authError });
      return res.status(400).json({ error: authError?.message || 'Failed to create user' });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      });

    if (profileError) {
      logger.error('Failed to create profile', { error: profileError });
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    // If student, create student record
    if (role === 'student' && track) {
      const { error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          user_id: authData.user.id,
          track,
        });

      if (studentError) {
        logger.error('Failed to create student record', { error: studentError });
      }
    }

    // If trainer, create trainer record
    if (role === 'trainer') {
      const { error: trainerError } = await supabaseAdmin
        .from('trainers')
        .insert({
          user_id: authData.user.id,
          specialization: track ? [track] : [],
        });

      if (trainerError) {
        logger.error('Failed to create trainer record', { error: trainerError });
      }
    }

    logger.info('User created successfully', { userId: authData.user.id, email, role });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email,
        role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Sign in
router.post('/signin', validateBody(signInSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      logger.warn('Sign in failed', { email, error: error?.message });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    logger.info('User signed in', { userId: data.user.id, email });

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      logger.error('Failed to fetch user profile', { error });
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Sign out
router.post('/signout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    logger.info('User signed out', { userId: req.user!.id });
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

