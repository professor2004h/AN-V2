import { supabaseAdmin } from '../lib/supabase';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        action_url: data.actionUrl,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  }

  async notifySubmissionReviewed(studentId: string, status: string, feedback: string, projectTitle: string) {
    const type = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning';
    const title = `Submission ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    const message = `Your submission for "${projectTitle}" has been ${status}. ${feedback}`;

    return this.createNotification({
      userId: studentId,
      type,
      title,
      message,
      actionUrl: '/student/projects',
    });
  }

  async notifyTaskAssigned(studentId: string, taskTitle: string, dueDate?: string) {
    const dueDateText = dueDate ? ` Due: ${new Date(dueDate).toLocaleDateString()}` : '';
    return this.createNotification({
      userId: studentId,
      type: 'info',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${taskTitle}".${dueDateText}`,
      actionUrl: '/student/tasks',
    });
  }

  async notifyWorkspaceStatusChange(studentId: string, status: string) {
    const statusMessages = {
      running: 'Your workspace is now running and ready to use.',
      stopped: 'Your workspace has been stopped.',
      error: 'There was an error with your workspace. Please contact support.',
      provisioning: 'Your workspace is being provisioned. This may take a few minutes.',
    };

    return this.createNotification({
      userId: studentId,
      type: status === 'error' ? 'error' : 'info',
      title: 'Workspace Status Update',
      message: statusMessages[status as keyof typeof statusMessages] || 'Workspace status changed.',
      actionUrl: '/student/workspace',
    });
  }

  async notifyMessageReceived(userId: string, senderName: string) {
    return this.createNotification({
      userId,
      type: 'info',
      title: 'New Message',
      message: `You have a new message from ${senderName}.`,
      actionUrl: '/student/messages',
    });
  }

  async notifyStudentAssigned(studentId: string, trainerName: string) {
    return this.createNotification({
      userId: studentId,
      type: 'info',
      title: 'Trainer Assigned',
      message: `${trainerName} has been assigned as your trainer.`,
    });
  }

  async notifyProjectUnlocked(studentId: string, projectTitle: string) {
    return this.createNotification({
      userId: studentId,
      type: 'success',
      title: 'New Project Unlocked',
      message: `Congratulations! You've unlocked a new project: "${projectTitle}".`,
      actionUrl: '/student/projects',
    });
  }
}

export const notificationService = new NotificationService();

