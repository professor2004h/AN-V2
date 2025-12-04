import { Lambda } from '@aws-sdk/client-lambda';
import { supabaseAdmin } from '../lib/supabase';
import { notificationService } from './notificationService';

// AWS Lambda client
const lambda = new Lambda({
    region: process.env.AWS_REGION || 'us-east-1',
});

// Progress callback type for real-time updates
export type ProgressCallback = (message: string, progress: number) => void;

export class WorkspaceServiceAWS {
    private readonly PROVISIONER_FUNCTION = 'apranova-lms-production-workspace-provisioner';
    private readonly TERMINATOR_FUNCTION = 'apranova-lms-production-workspace-terminator';

    // ==================== WORKSPACE PROVISIONING ====================

    async provisionWorkspace(studentId: string, onProgress?: ProgressCallback) {
        const sendProgress = (message: string, progress: number) => {
            console.log(`[${progress}%] ${message}`);
            if (onProgress) onProgress(message, progress);
        };

        try {
            // Check if workspace already exists
            sendProgress('Checking existing workspace...', 10);
            const existing = await this.getWorkspaceByStudentId(studentId);

            // If workspace exists and is running, return it
            if (existing && existing.status === 'running' && existing.url) {
                sendProgress('Workspace already running', 100);
                return existing;
            }

            // Get student details
            sendProgress('Fetching student details...', 20);
            const { data: student, error: studentError } = await supabaseAdmin
                .from('students')
                .select('*, profile:profiles(*)')
                .eq('id', studentId)
                .single();

            if (studentError) throw studentError;

            // Update status to provisioning
            sendProgress('Initializing workspace...', 30);
            await supabaseAdmin
                .from('students')
                .update({
                    workspace_status: 'provisioning',
                })
                .eq('id', studentId);

            // Invoke Lambda function to provision workspace
            sendProgress('Provisioning AWS workspace...', 40);

            const payload = {
                body: JSON.stringify({ student_id: studentId })
            };

            const command = {
                FunctionName: this.PROVISIONER_FUNCTION,
                InvocationType: 'RequestResponse' as const,
                Payload: JSON.stringify(payload),
            };

            sendProgress('Calling provisioning Lambda...', 50);
            const response = await lambda.invoke(command);

            if (!response.Payload) {
                throw new Error('No response from Lambda function');
            }

            const result = JSON.parse(Buffer.from(response.Payload).toString());
            console.log('Lambda response:', result);

            let workspaceData;
            if (result.body) {
                workspaceData = JSON.parse(result.body);
            } else {
                workspaceData = result;
            }

            sendProgress('Workspace provisioned successfully', 70);

            const workspaceUrl = workspaceData.workspace_url;
            const status = workspaceData.status || 'running';

            // Update student record with workspace URL
            sendProgress('Updating student record...', 80);
            const { data, error } = await supabaseAdmin
                .from('students')
                .update({
                    workspace_status: status,
                    workspace_url: workspaceUrl,
                    workspace_last_activity: new Date().toISOString(),
                })
                .eq('id', studentId)
                .select()
                .single();

            if (error) throw error;

            // Notify student
            sendProgress('Sending notification...', 90);
            await notificationService.notifyWorkspaceStatusChange(student.user_id, status);

            sendProgress('Workspace ready!', 100);

            return {
                id: studentId,
                studentId,
                url: workspaceUrl,
                status,
            };
        } catch (error: any) {
            console.error(`AWS workspace provisioning error for student ${studentId}:`, error);
            sendProgress(`Error: ${error.message}`, 0);

            // Update status to error
            await supabaseAdmin
                .from('students')
                .update({ workspace_status: 'error', workspace_url: null })
                .eq('id', studentId);

            // Notify student of error
            const { data: studentData } = await supabaseAdmin
                .from('students')
                .select('user_id')
                .eq('id', studentId)
                .single();

            if (studentData) {
                await notificationService.notifyWorkspaceStatusChange(studentData.user_id, 'error');
            }

            throw error;
        }
    }

    // ==================== WORKSPACE MANAGEMENT ====================

    async getWorkspaceByStudentId(studentId: string) {
        const { data, error } = await supabaseAdmin
            .from('students')
            .select('id, workspace_url, workspace_status')
            .eq('id', studentId)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            studentId: data.id,
            url: data.workspace_url,
            status: data.workspace_status,
        };
    }

    async startWorkspace(studentId: string) {
        // For AWS ECS, workspaces are always running once provisioned
        // Just update the activity timestamp
        const { data, error } = await supabaseAdmin
            .from('students')
            .update({
                workspace_last_activity: new Date().toISOString()
            })
            .eq('id', studentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async stopWorkspace(studentId: string) {
        // For AWS ECS with Lambda termination, workspaces auto-stop after TTL
        // This is a no-op for now
        const { data, error } = await supabaseAdmin
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

        if (error) throw error;
        return data;
    }

    async deleteWorkspace(studentId: string) {
        try {
            // Invoke Lambda function to terminate workspace
            const payload = {
                body: JSON.stringify({ student_id: studentId })
            };

            const command = {
                FunctionName: this.TERMINATOR_FUNCTION,
                InvocationType: 'Event' as const, // Async invocation
                Payload: JSON.stringify(payload),
            };

            await lambda.invoke(command);

            const { data, error } = await supabaseAdmin
                .from('students')
                .update({
                    workspace_status: null,
                    workspace_url: null,
                })
                .eq('id', studentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    }

    // ==================== CLEANUP & ACTIVITY ====================

    async updateActivity(studentId: string) {
        try {
            await supabaseAdmin
                .from('students')
                .update({ workspace_last_activity: new Date().toISOString() })
                .eq('id', studentId);
        } catch (error) {
            console.error(`Failed to update activity for student ${studentId}:`, error);
        }
    }
}

export const workspaceServiceAWS = new WorkspaceServiceAWS();
