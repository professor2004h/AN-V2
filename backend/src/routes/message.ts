import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticate);

const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  subject: z.string().optional(),
  message: z.string().min(1),
  parentMessageId: z.string().uuid().optional(),
});

// Send message
router.post('/', validateBody(sendMessageSchema), async (req: AuthRequest, res, next) => {
  try {
    const { recipientId, subject, message, parentMessageId } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: req.user!.id,
        recipient_id: recipientId,
        subject,
        message,
        parent_message_id: parentMessageId,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Get user messages
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { type } = req.query; // 'sent' or 'received'
    
    let query = supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)
      `);
    
    if (type === 'sent') {
      query = query.eq('sender_id', req.user!.id);
    } else if (type === 'received') {
      query = query.eq('recipient_id', req.user!.id);
    } else {
      query = query.or(`sender_id.eq.${req.user!.id},recipient_id.eq.${req.user!.id}`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;

