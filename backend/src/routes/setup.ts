import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';

const router = Router();

/**
 * ONE-TIME SETUP ENDPOINT
 * Creates default admin, trainer, and super admin accounts
 * 
 * POST /api/setup/create-default-users
 * 
 * This endpoint should only be called ONCE during initial setup
 * After setup, you can disable this endpoint for security
 */
router.post('/create-default-users', async (req, res) => {
  try {
    logger.info('Starting default users creation...');

    const defaultUsers = [
      {
        email: 'superadmin@apranova.com',
        password: 'SuperAdmin123!',
        fullName: 'Super Administrator',
        role: 'superadmin' as const,
      },
      {
        email: 'admin@apranova.com',
        password: 'Admin123!',
        fullName: 'System Admin',
        role: 'admin' as const,
      },
      {
        email: 'trainer@apranova.com',
        password: 'Trainer123!',
        fullName: 'John Trainer',
        role: 'trainer' as const,
        specialization: 'Data Science & Python',
        bio: 'Experienced trainer in data science and full-stack development',
      },
    ];

    const results = [];

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser?.users?.some(u => u.email === userData.email);

        if (userExists) {
          logger.info(`User ${userData.email} already exists, skipping...`);
          results.push({
            email: userData.email,
            status: 'already_exists',
            message: 'User already exists',
          });
          continue;
        }

        // 1. Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.fullName,
          },
        });

        if (authError) {
          logger.error(`Failed to create auth user for ${userData.email}:`, authError);
          results.push({
            email: userData.email,
            status: 'error',
            message: authError.message,
          });
          continue;
        }

        logger.info(`Created auth user: ${userData.email}`);

        // 2. Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authUser.user!.id,
            email: userData.email,
            full_name: userData.fullName,
            role: userData.role,
          });

        if (profileError) {
          logger.error(`Failed to create profile for ${userData.email}:`, profileError);
          // Rollback: delete auth user
          await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id);
          results.push({
            email: userData.email,
            status: 'error',
            message: `Profile creation failed: ${profileError.message}`,
          });
          continue;
        }

        logger.info(`Created profile for: ${userData.email}`);

        // 3. Create role-specific record (only for trainer)
        if (userData.role === 'trainer') {
          // Try with bio first, if it fails, try without bio
          let trainerError;
          let trainerData: any = {
            user_id: authUser.user!.id,
            specialization: userData.specialization,
            bio: userData.bio,
          };

          const { error: trainerErrorWithBio } = await supabaseAdmin
            .from('trainers')
            .insert(trainerData);

          if (trainerErrorWithBio) {
            // If bio column doesn't exist, try without it
            if (trainerErrorWithBio.message.includes('bio')) {
              logger.warn(`Bio column not found, creating trainer without bio...`);
              delete trainerData.bio;
              const { error: trainerErrorWithoutBio } = await supabaseAdmin
                .from('trainers')
                .insert(trainerData);
              trainerError = trainerErrorWithoutBio;
            } else {
              trainerError = trainerErrorWithBio;
            }
          }

          if (trainerError) {
            logger.error(`Failed to create trainer record for ${userData.email}:`, trainerError);
            // Rollback: delete profile and auth user
            await supabaseAdmin.from('profiles').delete().eq('id', authUser.user!.id);
            await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id);
            results.push({
              email: userData.email,
              status: 'error',
              message: `Trainer record creation failed: ${trainerError.message}`,
            });
            continue;
          }

          logger.info(`Created trainer record for: ${userData.email}`);
        }

        results.push({
          email: userData.email,
          role: userData.role,
          status: 'success',
          message: 'User created successfully',
        });

        logger.info(`✅ Successfully created ${userData.role}: ${userData.email}`);
      } catch (error: any) {
        logger.error(`Error creating user ${userData.email}:`, error);
        results.push({
          email: userData.email,
          status: 'error',
          message: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const alreadyExistsCount = results.filter(r => r.status === 'already_exists').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      message: `Setup completed: ${successCount} created, ${alreadyExistsCount} already existed, ${errorCount} failed`,
      results,
    });
  } catch (error: any) {
    logger.error('Setup failed:', error);
    res.status(500).json({ error: 'Setup failed', details: error.message });
  }
});

export default router;

