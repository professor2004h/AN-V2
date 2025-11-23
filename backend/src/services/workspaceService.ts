import { supabaseAdmin } from '../lib/supabase';
import { exec } from 'child_process';
import { promisify } from 'util';
import { notificationService } from './notificationService';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Base path for workspace data - configurable via env var
const WORKSPACE_BASE_PATH = process.env.WORKSPACE_BASE_PATH || path.join(process.cwd(), 'workspace-data');

// Progress callback type for real-time updates
export type ProgressCallback = (message: string, progress: number) => void;

export class WorkspaceService {
  private readonly CODE_SERVER_IMAGE = 'codercom/code-server:latest';
  private readonly BASE_PORT = 8080;

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

    // Generate unique container name and port
    const containerName = `codeserver-${studentId.substring(0, 8)}`;
    const port = await this.findAvailablePort();

    try {
      // Update status to provisioning
      sendProgress('Initializing workspace...', 15);
      await supabaseAdmin
        .from('students')
        .update({
          workspace_url: `http://localhost:${port}`,
          workspace_status: 'provisioning',
        })
        .eq('id', studentId);

      // Create workspace directory if it doesn't exist
      sendProgress('Creating workspace directory...', 20);
      const workspacePath = path.join(WORKSPACE_BASE_PATH, studentId);
      if (!fs.existsSync(workspacePath)) {
        fs.mkdirSync(workspacePath, { recursive: true });
      }

      // Inject Code-Server settings for auto-save BEFORE creating container
      sendProgress('Configuring auto-save settings...', 25);
      await this.injectCodeServerSettings(workspacePath);

      // Pull Docker image if not exists
      sendProgress('Checking Docker image...', 30);
      try {
        await execAsync(`docker inspect ${this.CODE_SERVER_IMAGE}`);
        sendProgress('Docker image found', 35);
      } catch {
        sendProgress('Pulling Docker image (this may take a few minutes)...', 35);
        await execAsync(`docker pull ${this.CODE_SERVER_IMAGE}`);
        sendProgress('Docker image pulled successfully', 45);
      }

      // Create Docker container with bind mount for entire /home/coder directory
      // This ensures settings, extensions, and project files all persist
      sendProgress('Creating Docker container...', 50);
      const absoluteWorkspacePath = path.resolve(workspacePath);
      const dockerCommand = `docker run -d --name ${containerName} -p ${port}:8080 -v "${absoluteWorkspacePath}:/home/coder" -e PASSWORD=apranova123 ${this.CODE_SERVER_IMAGE}`;

      const { stdout: containerId, stderr } = await execAsync(dockerCommand);

      if (stderr && !containerId) {
        throw new Error(`Docker container creation failed: ${stderr}`);
      }

      sendProgress('Container created successfully', 60);

      // Wait for container to be ready
      sendProgress('Starting container...', 65);
      await this.waitForContainer(containerName);
      sendProgress('Container is running', 70);

      // Install required tools in the container
      sendProgress('Installing Python 3.11...', 75);
      await this.installTools(containerName, onProgress);

      // Update status to running
      sendProgress('Finalizing workspace...', 95);
      const { data, error } = await supabaseAdmin
        .from('students')
        .update({
          workspace_status: 'running',
          workspace_url: `http://localhost:${port}`,
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
        containerName,
        url: `http://localhost:${port}`,
        status: 'running',
      };
    } catch (error: any) {
      console.error(`Workspace provisioning error for student ${studentId}:`, error);
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

  // ==================== AUTO-SAVE CONFIGURATION ====================

  private async injectCodeServerSettings(workspacePath: string) {
    const settingsDir = path.join(workspacePath, '.local', 'share', 'code-server', 'User');
    const settingsFile = path.join(settingsDir, 'settings.json');

    // Create directory if it doesn't exist
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }

    // Code-Server settings with auto-save enabled
    const settings = {
      "files.autoSave": "afterDelay",
      "files.autoSaveDelay": 1000, // 1 second after typing stops
      "editor.formatOnSave": true,
      "editor.formatOnPaste": true,
      "workbench.startupEditor": "none",
      "workbench.colorTheme": "Default Dark+",
      "terminal.integrated.defaultProfile.linux": "bash"
    };

    // Write settings file
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    console.log(`Auto-save settings injected at: ${settingsFile}`);
  }

  // ==================== TOOL INSTALLATION ====================

  private async installTools(containerName: string, onProgress?: ProgressCallback) {
    const sendProgress = (message: string, progress: number) => {
      console.log(`[${progress}%] ${message}`);
      if (onProgress) onProgress(message, progress);
    };

    try {
      // Update package list
      sendProgress('Updating package list...', 76);
      await execAsync(`docker exec ${containerName} sh -c "sudo apt-get update -qq"`);

      // Install Python 3.11
      sendProgress('Installing Python 3.11...', 80);
      await execAsync(`docker exec ${containerName} sh -c "sudo apt-get install -y -qq python3 python3-pip"`);

      // Install Node.js 20
      sendProgress('Installing Node.js 20...', 85);
      await execAsync(`docker exec ${containerName} sh -c "sudo apt-get install -y -qq nodejs npm"`);

      // Install Git and development tools
      sendProgress('Installing Git and development tools...', 90);
      await execAsync(`docker exec ${containerName} sh -c "sudo apt-get install -y -qq git curl wget"`);

      sendProgress('All tools installed successfully', 93);
    } catch (installError) {
      console.warn('Failed to install some tools, continuing anyway:', installError);
      sendProgress('Warning: Some tools may not be installed', 93);
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
    const containerName = `codeserver-${studentId.substring(0, 8)}`;

    try {
      await execAsync(`docker start ${containerName}`);

      const { data, error } = await supabaseAdmin
        .from('students')
        .update({
          workspace_status: 'running',
          workspace_last_activity: new Date().toISOString()
        })
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
        const isRunning = stdout.trim().replace(/'/g, '') === 'true';
        if (isRunning) {
          console.log(`Container ${containerName} is running!`);
          return;
        }
      } catch (error) {
        // Container not ready yet
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
