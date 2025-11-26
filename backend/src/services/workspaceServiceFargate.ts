import { supabaseAdmin } from '../lib/supabase';
import { ECSClient, RunTaskCommand, StopTaskCommand, DescribeTasksCommand, ListTasksCommand } from '@aws-sdk/client-ecs';
import { notificationService } from './notificationService';

const ecs = new ECSClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Progress callback type for real-time updates
export type ProgressCallback = (message: string, progress: number) => void;

export class WorkspaceService {
    private readonly ECS_CLUSTER = process.env.ECS_CLUSTER_NAME || 'apranova-lms-cluster';
    private readonly CODE_SERVER_TASK_DEF = process.env.CODE_SERVER_TASK_DEFINITION || 'apranova-lms-code-server';
    private readonly SUBNETS = (process.env.CODE_SERVER_SUBNETS || '').split(',');
    private readonly SECURITY_GROUP = process.env.CODE_SERVER_SECURITY_GROUP || '';
    private readonly EFS_FILE_SYSTEM_ID = process.env.EFS_FILE_SYSTEM_ID || '';

    // ==================== WORKSPACE PROVISIONING ====================

    async provisionWorkspace(studentId: string, onProgress?: ProgressCallback) {
        const sendProgress = (message: string, progress: number) => {
            console.log(`[${progress}%] ${message}`);
            if (onProgress) onProgress(message, progress);
        };

        // Check if workspace already exists
        const existing = await this.getWorkspaceByStudentId(studentId);

        // If workspace exists and is running, return it
        if (existing && existing.status === 'running') {
            sendProgress('Workspace already running', 100);
            return existing;
        }

        // If workspace is stuck in provisioning or error status, reset it
        if (existing && (existing.status === 'provisioning' || existing.status === 'error')) {
            sendProgress('Resetting workspace status...', 5);
            await supabaseAdmin
                .from('students')
                .update({
                    workspace_url: null,
                    workspace_status: null,
                    workspace_task_arn: null,
                })
                .eq('id', studentId);
        }

        // Get student details
        sendProgress('Fetching student details...', 10);
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('*, profile:profiles(*)')
            .eq('id', studentId)
            .single();

        if (studentError) throw studentError;

        try {
            // Update status to provisioning
            sendProgress('Initializing workspace...', 15);
            await supabaseAdmin
                .from('students')
                .update({
                    workspace_status: 'provisioning',
                })
                .eq('id', studentId);

            // Launch ECS Fargate task for code-server
            sendProgress('Launching code-server container...', 30);

            const runTaskCommand = new RunTaskCommand({
                cluster: this.ECS_CLUSTER,
                taskDefinition: this.CODE_SERVER_TASK_DEF,
                launchType: 'FARGATE',
                networkConfiguration: {
                    awsvpcConfiguration: {
                        subnets: this.SUBNETS,
                        securityGroups: [this.SECURITY_GROUP],
                        assignPublicIp: 'DISABLED',
                    },
                },
                overrides: {
                    containerOverrides: [
                        {
                            name: 'code-server',
                            environment: [
                                {
                                    name: 'STUDENT_ID',
                                    value: studentId,
                                },
                                {
                                    name: 'WORKSPACE_PATH',
                                    value: `/workspaces/${studentId}`,
                                },
                            ],
                        },
                    ],
                },
                tags: [
                    {
                        key: 'StudentId',
                        value: studentId,
                    },
                    {
                        key: 'StudentEmail',
                        value: student.profile?.email || 'unknown',
                    },
                    {
                        key: 'Environment',
                        value: process.env.NODE_ENV || 'production',
                    },
                ],
            });

            const runTaskResponse = await ecs.send(runTaskCommand);

            if (runTaskResponse.failures && runTaskResponse.failures.length > 0) {
                const failure = runTaskResponse.failures[0];
                const errorMsg = `Failed to launch code-server task: ${failure.reason} (ARN: ${failure.arn})`;
                console.error(errorMsg, failure);
                throw new Error(errorMsg);
            }

            if (!runTaskResponse.tasks || runTaskResponse.tasks.length === 0) {
                throw new Error('Failed to launch code-server task: No tasks returned');
            }

            const task = runTaskResponse.tasks[0];
            const taskArn = task.taskArn!;
            const taskId = taskArn.split('/').pop()!;

            sendProgress('Container launched successfully', 50);

            // Wait for task to be running
            sendProgress('Waiting for container to start...', 60);
            await this.waitForTaskRunning(taskArn);
            sendProgress('Container is running', 70);

            // Get task details to extract network interface
            const describeTasksResponse = await ecs.send(new DescribeTasksCommand({
                cluster: this.ECS_CLUSTER,
                tasks: [taskArn],
            }));

            const runningTask = describeTasksResponse.tasks?.[0];
            if (!runningTask) {
                throw new Error('Failed to get task details');
            }

            // Extract private IP from network interface
            const networkInterface = runningTask.attachments?.[0]?.details?.find(
                (detail: any) => detail.name === 'privateIPv4Address'
            );
            const privateIp = networkInterface?.value;

            if (!privateIp) {
                throw new Error('Failed to get task IP address');
            }

            const workspaceUrl = `http://${privateIp}:8080`;

            // Update status to running
            sendProgress('Finalizing workspace...', 95);
            const { data, error } = await supabaseAdmin
                .from('students')
                .update({
                    workspace_status: 'running',
                    workspace_url: workspaceUrl,
                    workspace_task_arn: taskArn,
                    workspace_last_activity: new Date().toISOString(),
                })
                .eq('id', studentId)
                .select()
                .single();

            if (error) throw error;

            // Notify student
            await notificationService.notifyWorkspaceStatusChange(student.user_id, 'running');

            sendProgress('Workspace ready!', 100);

            return {
                id: studentId,
                studentId,
                taskArn,
                url: workspaceUrl,
                status: 'running',
            };
        } catch (error: any) {
            console.error(`Workspace provisioning error for student ${studentId}:`, error);
            sendProgress(`Error: ${error.message}`, 0);

            // Update status to error
            await supabaseAdmin
                .from('students')
                .update({ workspace_status: 'error', workspace_url: null, workspace_task_arn: null })
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
            .select('id, workspace_url, workspace_status, workspace_task_arn')
            .eq('id', studentId)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            studentId: data.id,
            url: data.workspace_url,
            status: data.workspace_status,
            taskArn: data.workspace_task_arn,
        };
    }

    async startWorkspace(studentId: string) {
        // For ECS Fargate, we need to provision a new task
        return this.provisionWorkspace(studentId);
    }

    async stopWorkspace(studentId: string) {
        try {
            const workspace = await this.getWorkspaceByStudentId(studentId);

            if (!workspace.taskArn) {
                throw new Error('No task ARN found for workspace');
            }

            // Stop the ECS task
            await ecs.send(new StopTaskCommand({
                cluster: this.ECS_CLUSTER,
                task: workspace.taskArn,
                reason: 'User requested stop',
            }));

            const { data, error } = await supabaseAdmin
                .from('students')
                .update({ workspace_status: 'stopped', workspace_task_arn: null })
                .eq('id', studentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    }

    async deleteWorkspace(studentId: string) {
        try {
            const workspace = await this.getWorkspaceByStudentId(studentId);

            if (workspace.taskArn) {
                // Stop the ECS task
                await ecs.send(new StopTaskCommand({
                    cluster: this.ECS_CLUSTER,
                    task: workspace.taskArn,
                    reason: 'Workspace deleted',
                }));
            }

            // Note: EFS data persists, so student files are not deleted
            const { data, error } = await supabaseAdmin
                .from('students')
                .update({
                    workspace_status: null,
                    workspace_url: null,
                    workspace_task_arn: null,
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

    // ==================== HELPER METHODS ====================

    private async waitForTaskRunning(taskArn: string, maxWait = 120000): Promise<void> {
        console.log(`Waiting for task ${taskArn} to be running...`);
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            try {
                const describeTasksResponse = await ecs.send(new DescribeTasksCommand({
                    cluster: this.ECS_CLUSTER,
                    tasks: [taskArn],
                }));

                const task = describeTasksResponse.tasks?.[0];
                if (task && task.lastStatus === 'RUNNING') {
                    console.log(`Task ${taskArn} is running!`);
                    return;
                }

                if (task && task.lastStatus === 'STOPPED') {
                    throw new Error(`Task stopped unexpectedly: ${task.stoppedReason}`);
                }
            } catch (error) {
                console.error('Error checking task status:', error);
            }

            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        }

        throw new Error('Task failed to start within timeout period');
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

    async cleanupWorkspaces() {
        console.log('Running workspace cleanup...');
        try {
            // Find running workspaces with inactivity > 15 minutes
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

            const { data: inactiveStudents, error } = await supabaseAdmin
                .from('students')
                .select('id, workspace_status, workspace_last_activity, workspace_task_arn')
                .eq('workspace_status', 'running')
                .lt('workspace_last_activity', fifteenMinutesAgo);

            if (error) {
                console.error('Error fetching inactive workspaces:', error);
                return;
            }

            if (!inactiveStudents || inactiveStudents.length === 0) {
                return;
            }

            console.log(`Found ${inactiveStudents.length} inactive workspaces. Stopping them...`);

            for (const student of inactiveStudents) {
                console.log(`Stopping inactive workspace for student ${student.id}...`);
                try {
                    await this.stopWorkspace(student.id);
                } catch (err) {
                    console.error(`Failed to cleanup workspace for student ${student.id}:`, err);
                }
            }
        } catch (error) {
            console.error('Workspace cleanup failed:', error);
        }
    }
}

export const workspaceService = new WorkspaceService();
