import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.use(authenticate);

// Get user notifications
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { unreadOnly } = req.query;
    
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.id);
    
    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/mark-all-read', async (req: AuthRequest, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', req.user!.id)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;

