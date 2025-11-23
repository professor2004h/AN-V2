import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.use(authenticate);

// Get all projects
router.get('/', async (req, res, next) => {
  try {
    const { track } = req.query;
    
    let query = supabaseAdmin
      .from('projects')
      .select('*')
      .eq('is_active', true);
    
    if (track) {
      query = query.eq('track', track);
    }
    
    const { data, error } = await query.order('project_number', { ascending: true });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get project by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;

