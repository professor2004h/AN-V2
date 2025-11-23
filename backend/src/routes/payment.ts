import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createCheckoutSession, constructWebhookEvent } from '../lib/stripe';
import { supabaseAdmin } from '../lib/supabase';
import { config } from '../config';
import { logger } from '../lib/logger';

const router = Router();

// Create checkout session
router.post('/create-checkout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { amount } = req.body;
    
    // Get student
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', req.user!.id)
      .single();
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const session = await createCheckoutSession({
      studentId: student.id,
      studentEmail: req.user!.email,
      amount: amount || 999, // Default enrollment fee
      successUrl: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${config.frontendUrl}/payment/cancel`,
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    const event = await constructWebhookEvent(
      req.body,
      signature
    );
    
    logger.info('Stripe webhook received', { type: event.type });
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const studentId = session.metadata.student_id;
        
        // Create payment record
        await supabaseAdmin
          .from('payments')
          .insert({
            student_id: studentId,
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent,
            amount: session.amount_total / 100,
            currency: session.currency,
            status: 'completed',
            paid_at: new Date().toISOString(),
          });
        
        // Update student payment status
        await supabaseAdmin
          .from('students')
          .update({ payment_status: 'completed' })
          .eq('id', studentId);
        
        logger.info('Payment completed', { studentId, sessionId: session.id });
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        logger.error('Payment failed', { paymentIntentId: paymentIntent.id });
        break;
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;

