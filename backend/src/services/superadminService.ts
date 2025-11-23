import { supabaseAdmin } from '../lib/supabase';
import { stripe } from '../lib/stripe';
import { adminService } from './adminService';

export class SuperAdminService {
  // ==================== REVENUE STATISTICS ====================

  async getRevenueStats(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('payments')
      .select('*')
      .eq('status', 'completed');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: payments, error } = await query;
    if (error) throw error;

    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Revenue by track
    const revenueByTrack = payments.reduce((acc, p) => {
      const track = p.metadata?.track || 'unknown';
      acc[track] = (acc[track] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    // Revenue by status
    const { data: allPayments } = await supabaseAdmin
      .from('payments')
      .select('status, amount');

    const revenueByStatus = (allPayments || []).reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    // Monthly revenue (last 12 months)
    const monthlyRevenue = this.calculateMonthlyRevenue(payments);

    return {
      totalRevenue,
      revenueByTrack,
      revenueByStatus,
      monthlyRevenue,
      totalTransactions: payments.length,
    };
  }

  private calculateMonthlyRevenue(payments: any[]) {
    const monthlyData: Record<string, number> = {};

    payments.forEach(payment => {
      const date = new Date(payment.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));
  }

  // ==================== PAYMENT MANAGEMENT ====================

  async getAllPayments(page = 1, limit = 20, filters?: {
    status?: string;
    track?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        student:students!payments_student_id_fkey(
          *,
          profile:profiles(*)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Filter by track if needed (metadata field)
    let filteredData = data;
    if (filters?.track) {
      filteredData = data?.filter(p => p.metadata?.track === filters.track) || [];
    }

    return { payments: filteredData, total: count || 0 };
  }

  async getPaymentById(paymentId: string) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        student:students!payments_student_id_fkey(
          *,
          profile:profiles(*),
          batch:batches(*)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error) throw error;

    // Get Stripe payment details if available
    if (data.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          data.stripe_payment_intent_id
        );
        return { ...data, stripeDetails: paymentIntent };
      } catch (err) {
        console.error('Error fetching Stripe details:', err);
        return data;
      }
    }

    return data;
  }

  async exportPayments(format: 'csv' | 'pdf', filters?: any) {
    const { payments } = await this.getAllPayments(1, 10000, filters);

    if (format === 'csv') {
      return this.generateCSV(payments);
    } else {
      return this.generatePDF(payments);
    }
  }

  private generateCSV(payments: any[]) {
    const headers = ['Date', 'Student Name', 'Email', 'Amount', 'Status', 'Track', 'Transaction ID'];
    const rows = payments.map(p => [
      new Date(p.created_at).toLocaleDateString(),
      p.student?.profile?.full_name || 'N/A',
      p.student?.profile?.email || 'N/A',
      `$${(p.amount / 100).toFixed(2)}`,
      p.status,
      p.metadata?.track || 'N/A',
      p.stripe_payment_intent_id || 'N/A',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }

  private generatePDF(payments: any[]) {
    // For now, return a simple text format
    // In production, use a library like pdfkit or puppeteer
    return `Payment Report\n\nTotal Payments: ${payments.length}\n\n` +
      payments.map(p =>
        `${new Date(p.created_at).toLocaleDateString()} - ${p.student?.profile?.full_name} - $${(p.amount / 100).toFixed(2)}`
      ).join('\n');
  }

  // ==================== FINANCIAL ANALYTICS ====================

  async getFinancialAnalytics() {
    // Revenue per batch
    const { data: batchRevenue } = await supabaseAdmin
      .from('payments')
      .select(`
        amount,
        student:students!payments_student_id_fkey(
          batch:batches(id, name)
        )
      `)
      .eq('status', 'completed');

    const revenuePerBatch = (batchRevenue || []).reduce((acc, p) => {
      const batch = Array.isArray(p.student?.batch) ? p.student?.batch[0] : p.student?.batch;
      const batchName = batch?.name || 'No Batch';
      acc[batchName] = (acc[batchName] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    // Revenue per trainer
    const { data: trainerRevenue } = await supabaseAdmin
      .from('payments')
      .select(`
        amount,
        student:students!payments_student_id_fkey(
          trainer:trainers(
            id,
            profile:profiles(full_name)
          )
        )
      `)
      .eq('status', 'completed');

    const revenuePerTrainer = (trainerRevenue || []).reduce((acc, p) => {
      const trainer = Array.isArray(p.student?.trainer) ? p.student?.trainer[0] : p.student?.trainer;
      const profile = Array.isArray(trainer?.profile) ? trainer?.profile[0] : trainer?.profile;
      const trainerName = profile?.full_name || 'Unassigned';
      acc[trainerName] = (acc[trainerName] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    // Payment success rate
    const { data: allPayments } = await supabaseAdmin
      .from('payments')
      .select('status');

    const total = allPayments?.length || 0;
    const successful = allPayments?.filter(p => p.status === 'completed').length || 0;
    const failed = allPayments?.filter(p => p.status === 'failed').length || 0;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      revenuePerBatch,
      revenuePerTrainer,
      paymentStats: {
        total,
        successful,
        failed,
        successRate: successRate.toFixed(2),
      },
    };
  }

  // ==================== ADMIN MANAGEMENT ====================

  async createAdmin(data: {
    email: string;
    password: string;
    fullName: string;
  }) {
    const { user, profile } = await adminService.createUserWithRole({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: 'admin',
    });

    return { user, profile };
  }

  async deleteAdmin(userId: string) {
    // Deactivate admin account
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('role', 'admin')
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const superadminService = new SuperAdminService();

