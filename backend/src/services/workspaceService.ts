import { supabaseAdmin } from '../lib/supabase';
import { exec } from 'child_process';
import { promisify } from 'util';
import { notificationService } from './notificationService';

const execAsync = promisify(exec);
import * as fs from 'fs';
import * as path from 'path';

// Base path for workspace data - configurable via env var
const WORKSPACE_BASE_PATH = process.env.WORKSPACE_BASE_PATH || path.join(process.cwd(), 'workspace-data');

export class WorkspaceService {
  private readonly CODE_SERVER_IMAGE = 'codercom/code-server:latest';
  private readonly BASE_PORT = 8080;

  // ==================== WORKSPACE PROVISIONING ====================

  async provisionWorkspace(studentId: string) {
    // Check if workspace already exists
    const existing = await this.getWorkspaceByStudentId(studentId);

    // If workspace exists and is running, return it
    if (existing && existing.status === 'running') {
      return existing;
    }

    // If workspace is stuck in provisioning or error status, reset it
    if (existing && (existing.status === 'provisioning' || existing.status === 'error')) {
      console.log(`Resetting workspace status for student ${studentId}...`);
      await supabaseAdmin
        .from('students')
        .update({
          workspace_url: null,
          workspace_status: null,
        })
        .eq('id', studentId);
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*, profile:profiles(*)')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Generate unique container name and port
    const containerName = `codeserver-${studentId.substring(0, 8)}`;
    const port = await this.findAvailablePort();

    try {
      // Update status to provisioning
      await supabaseAdmin
        .from('students')
        .update({
          workspace_url: `http://localhost:${port}`,
          workspace_status: 'provisioning',
        })
        .eq('id', studentId);

      // Create Docker container with pre-installed tools
      // Create workspace directory if it doesn't exist
      const workspacePath = path.join(WORKSPACE_BASE_PATH, studentId);
      if (!fs.existsSync(workspacePath)) {
        console.log(`Creating workspace directory: ${workspacePath}`);
        fs.mkdirSync(workspacePath, { recursive: true });
        // Set permissions to ensure container can write (777 is easiest for dev, but 755/chown is better for prod)
        // In Windows, permissions are handled differently, but for bind mounts it usually works.
      }

      // Create Docker container with bind mount instead of named volume
      // Use absolute path for bind mount
      const absoluteWorkspacePath = path.resolve(workspacePath);
      const dockerCommand = `docker run -d --name ${containerName} -p ${port}:8080 -v "${absoluteWorkspacePath}:/home/coder/project" -e PASSWORD=apranova123 ${this.CODE_SERVER_IMAGE}`;

      console.log(`Creating Docker container: ${containerName} on port ${port}`);
      const { stdout: containerId, stderr } = await execAsync(dockerCommand);

      if (stderr && !containerId) {
        throw new Error(`Docker container creation failed: ${stderr}`);
      }

      console.log(`Container created: ${containerId.trim()}`);

      // Wait for container to be ready
      await this.waitForContainer(containerName);

      // Install required tools in the container (optional, don't fail if this errors)
      const installCommand = `docker exec ${containerName} sh -c "sudo apt-get update && sudo apt-get install -y python3 python3-pip nodejs npm git"`;

      try {
        console.log(`Installing tools in container ${containerName}...`);
        await execAsync(installCommand);
        console.log('Tools installed successfully');
      } catch (installError) {
        console.warn('Failed to install some tools, continuing anyway:', installError);
      }

      // Update status to running
      const { data, error } = await supabaseAdmin
        .from('students')
        .update({
          workspace_status: 'running',
          workspace_url: `http://localhost:${port}`,
          workspace_last_activity: new Date().toISOString(), // Initialize activity timestamp
        })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      // Notify student
      await notificationService.notifyWorkspaceStatusChange(student.user_id, 'running');

      return {
        id: studentId,  // Add id field for API response
        studentId,
        containerName,
        url: `http://localhost:${port}`,
        status: 'running',
      };
    } catch (error: any) {
      console.error(`Workspace provisioning error for student ${studentId}:`, error);

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

      // Clean up failed container if it exists
      try {
        await execAsync(`docker stop ${containerName} || true`);
        await execAsync(`docker rm ${containerName} || true`);
      } catch (cleanupError) {
        console.warn('Failed to cleanup container:', cleanupError);
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
      id: data.id,  // Add id field for API response
      studentId: data.id,
      url: data.workspace_url,
      status: data.workspace_status,
    };
  }

  async startWorkspace(studentId: string) {
    const containerName = `codeserver-${studentId.substring(0, 8)}`;

    try {
      await execAsync(`docker start ${containerName}`);

      const { data, error } = await supabaseAdmin
        .from('students')
        .update({ workspace_status: 'running' })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      await supabaseAdmin
        .from('students')
        .update({ workspace_status: 'error' })
        .eq('id', studentId);

      throw error;
    }
  }

  async stopWorkspace(studentId: string) {
    const containerName = `codeserver-${studentId.substring(0, 8)}`;

    try {
      await execAsync(`docker stop ${containerName}`);

      const { data, error } = await supabaseAdmin
        .from('students')
        .update({ workspace_status: 'stopped' })
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
    const containerName = `codeserver-${studentId.substring(0, 8)}`;

    try {
      // Stop and remove container
      await execAsync(`docker stop ${containerName} || true`);
      await execAsync(`docker rm ${containerName} || true`);
      // Do NOT remove the data directory (bind mount) to ensure persistence
      // await execAsync(`docker volume rm ${containerName}-data || true`);

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

  // ==================== HELPER METHODS ====================

  private async findAvailablePort(): Promise<number> {
    // Simple port allocation - in production, use a more robust method
    const randomPort = Math.floor(Math.random() * 1000) + 9000;
    return randomPort;
  }

  private async waitForContainer(containerName: string, maxWait = 60000): Promise<void> {
    console.log(`Waiting for container ${containerName} to be ready...`);
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      try {
        const { stdout } = await execAsync(`docker inspect -f '{{.State.Running}}' ${containerName}`);
        console.log(`Inspect ${containerName}: ${stdout.trim()}`);
        const isRunning = stdout.trim().replace(/'/g, '') === 'true';
        if (isRunning) {
          console.log(`Container ${containerName} is running!`);
          return;
        }
      } catch (error) {
        console.log(`Inspect failed: ${error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Container failed to start within timeout period');
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
        .select('id, workspace_status, workspace_last_activity')
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
          const containerName = `codeserver-${student.id.substring(0, 8)}`;
          await execAsync(`docker stop ${containerName} || true`);
          await execAsync(`docker rm ${containerName} || true`);

          await supabaseAdmin
            .from('students')
            .update({ workspace_status: 'stopped' })
            .eq('id', student.id);

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
