import { supabaseAdmin } from '../lib/supabase';
import { ECSClient, RunTaskCommand, StopTaskCommand, DescribeTasksCommand, ListTasksCommand } from '@aws-sdk/client-ecs';
import { ElasticLoadBalancingV2Client, RegisterTargetsCommand, DeregisterTargetsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { notificationService } from './notificationService';

const ecs = new ECSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const elbv2 = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Progress callback type for real-time updates
export type ProgressCallback = (message: string, progress: number) => void;

export class WorkspaceService {
    private readonly ECS_CLUSTER = process.env.ECS_CLUSTER_NAME || 'apranova-lms-cluster';
    private readonly CODE_SERVER_TASK_DEF = process.env.CODE_SERVER_TASK_DEFINITION || 'apranova-lms-code-server';
    private readonly SUBNETS = (process.env.CODE_SERVER_SUBNETS || '').split(',');
    private readonly SECURITY_GROUP = process.env.CODE_SERVER_SECURITY_GROUP || '';
    private readonly EFS_FILE_SYSTEM_ID = process.env.EFS_FILE_SYSTEM_ID || '';
    private readonly TARGET_GROUP_ARN = process.env.CODE_SERVER_TARGET_GROUP_ARN || '';
    private readonly ALB_DNS_NAME = process.env.ALB_DNS_NAME || '';
    private readonly DOMAIN = process.env.DOMAIN || process.env.ALB_DNS_NAME || 'ecombinators.com';

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
                            command: [
                                '/bin/sh',
                                '-c',
                                `code-server --auth none --bind-addr 0.0.0.0:8080 /workspaces/${studentId}`
                            ],
                            environment: [
                                {
                                    name: 'STUDENT_ID',
                                    value: studentId,
                                },
                                {
                                    name: 'WORKSPACE_PATH',
                                    value: `/workspaces/${studentId}`,
                                },
                                {
                                    name: 'AUTH',
                                    value: 'none',
                                },
                                {
                                    name: 'CS_DISABLE_CSRF_PROTECTION',
                                    value: 'true',
                                },
                                {
                                    name: 'PROXY_DOMAIN',
                                    value: 'ecombinators.com',
                                },
                                {
                                    name: 'BASE_PATH',
                                    value: `/api/proxy/workspace/${studentId}`,
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

            console.log('[DEBUG] RunTaskCommand config:', JSON.stringify({
                cluster: this.ECS_CLUSTER,
                subnets: this.SUBNETS,
                securityGroup: this.SECURITY_GROUP,
                assignPublicIp: 'ENABLED'
            }));

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
            await this.waitForTaskRunning(taskArn, 300000, (msg) => sendProgress(msg, 65)); // 5 mins max wait
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
            const privateIpDetail = runningTask.attachments?.[0]?.details?.find(
                (detail: any) => detail.name === 'privateIPv4Address'
            );
            const privateIp = privateIpDetail?.value;

            if (!privateIp) {
                throw new Error('Failed to get task private IP address');
            }

            // Cleanup old workspace task (stop it)
            sendProgress('Cleaning up old workspace...', 73);
            await this.cleanupOldWorkspaceTarget(studentId);

            // No need to register with ALB anymore as we use backend proxy
            // await this.registerWithTargetGroup(privateIp, studentId);

            // Use Backend Proxy URL with custom domain (HTTPS)
            const workspaceUrl = `https://${this.DOMAIN}/api/proxy/workspace/${studentId}`;

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

    private async waitForTaskRunning(taskArn: string, maxWait = 300000, onProgress?: (msg: string) => void): Promise<void> {
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

            if (onProgress) {
                onProgress(`Waiting for container to start... (${Math.round((Date.now() - startTime) / 1000)}s)`);
            }
            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        }

        throw new Error('Task failed to start within timeout period');
    }

    private async registerWithTargetGroup(privateIp: string, studentId: string): Promise<void> {
        if (!this.TARGET_GROUP_ARN) {
            console.warn('No target group ARN configured, skipping registration');
            return;
        }

        try {
            console.log(`Registering ${privateIp} with target group for student ${studentId}`);
            await elbv2.send(new RegisterTargetsCommand({
                TargetGroupArn: this.TARGET_GROUP_ARN,
                Targets: [{
                    Id: privateIp,
                    Port: 8080,
                }],
            }));
            console.log(`Successfully registered ${privateIp} with target group`);
        } catch (error) {
            console.error('Failed to register with target group:', error);
            throw new Error(`Failed to register workspace with load balancer: ${error}`);
        }
    }

    private async deregisterFromTargetGroup(privateIp: string): Promise<void> {
        if (!this.TARGET_GROUP_ARN) {
            return;
        }

        try {
            console.log(`Deregistering ${privateIp} from target group`);
            await elbv2.send(new DeregisterTargetsCommand({
                TargetGroupArn: this.TARGET_GROUP_ARN,
                Targets: [{
                    Id: privateIp,
                    Port: 8080,
                }],
            }));
            console.log(`Successfully deregistered ${privateIp} from target group`);
        } catch (error) {
            console.error('Failed to deregister from target group:', error);
        }
    }

    private async cleanupOldWorkspaceTarget(studentId: string): Promise<void> {
        if (!this.TARGET_GROUP_ARN) {
            return;
        }

        try {
            // Get student's current workspace info
            const { data: student } = await supabaseAdmin
                .from('students')
                .select('workspace_task_arn')
                .eq('id', studentId)
                .single();

            if (!student?.workspace_task_arn) {
                console.log('No old workspace to cleanup');
                return;
            }

            // Get old task details to extract IP
            const describeTasksResponse = await ecs.send(new DescribeTasksCommand({
                cluster: this.ECS_CLUSTER,
                tasks: [student.workspace_task_arn],
            }));

            const oldTask = describeTasksResponse.tasks?.[0];
            if (!oldTask) {
                console.log('Old task not found, skipping cleanup');
                return;
            }

            // Extract old task's private IP
            const oldPrivateIpDetail = oldTask.attachments?.[0]?.details?.find(
                (detail: any) => detail.name === 'privateIPv4Address'
            );
            const oldPrivateIp = oldPrivateIpDetail?.value;

            if (oldPrivateIp) {
                console.log(`Cleaning up old workspace task: ${oldPrivateIp}`);
                // No need to deregister as we don't register anymore
                // await this.deregisterFromTargetGroup(oldPrivateIp);

                // Stop old task
                try {
                    await ecs.send(new StopTaskCommand({
                        cluster: this.ECS_CLUSTER,
                        task: student.workspace_task_arn,
                        reason: 'Replacing with new workspace',
                    }));
                    console.log(`Stopped old task: ${student.workspace_task_arn}`);
                } catch (stopError) {
                    console.warn('Failed to stop old task:', stopError);
                }
            }
        } catch (error) {
            console.warn('Failed to cleanup old workspace target:', error);
            // Don't throw - this is cleanup, not critical for new workspace
        }
    }

    async getWorkspaceIp(studentId: string): Promise<string | null> {
        try {
            const { data: student } = await supabaseAdmin
                .from('students')
                .select('workspace_task_arn')
                .eq('id', studentId)
                .single();

            if (!student?.workspace_task_arn) return null;

            const describeTasksResponse = await ecs.send(new DescribeTasksCommand({
                cluster: this.ECS_CLUSTER,
                tasks: [student.workspace_task_arn],
            }));

            const task = describeTasksResponse.tasks?.[0];
            if (!task) return null;

            const privateIpDetail = task.attachments?.[0]?.details?.find(
                (detail: any) => detail.name === 'privateIPv4Address'
            );
            return privateIpDetail?.value || null;
        } catch (error) {
            console.error('Failed to get workspace IP:', error);
            return null;
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
