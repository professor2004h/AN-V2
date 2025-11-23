# Workspace System Analysis & Recommendations

## 1. Analysis of Current System
The current workspace system uses Docker containers with named volumes (`-v ${containerName}-data:/home/coder/project`). This provides persistence but locks data to the Docker host's volume storage, making migration and backup harder compared to bind mounts. There is no automatic cleanup, which could lead to resource exhaustion.

## 2. Recommendations for Enhancements

### A. Missing Features & Edge Cases
1.  **Graceful Shutdown Warning**:
    *   **Recommendation**: Implement a frontend warning 2 minutes before auto-shutdown.
    *   **Implementation**: Frontend polls `last_activity`. If `(now - last_activity) > 13 mins`, show a modal: "Workspace will close in 2 minutes. Move your mouse or type to keep it alive."
2.  **Resource Limits**:
    *   **Recommendation**: Enforce CPU and Memory limits per container to prevent one student from crashing the server.
    *   **Implementation**: Add `--cpus="1.0" --memory="1g"` to the `docker run` command.
3.  **Concurrent Access Handling**:
    *   **Recommendation**: Use a locking mechanism or database transaction when provisioning/destroying to prevent race conditions (e.g., user clicks "Start" while "Auto-destroy" is running).
4.  **Orphaned Container Cleanup**:
    *   **Recommendation**: On server startup, check for containers that don't match any "running" student in the DB and stop them.

### B. Handling Active Coding Scenarios
*   **Problem**: If a student is coding but not interacting with the *LMS dashboard* (just the Code-Server iframe/tab), the LMS might not know they are active.
*   **Solution**:
    *   **Heartbeat**: The Code-Server page (if embedded) or a separate "Workspace Manager" component in the frontend should send a "heartbeat" API request (`POST /api/workspaces/heartbeat`) every minute.
    *   **Proxy (Advanced)**: Route all Code-Server traffic through an Nginx proxy that updates the timestamp. (Overkill for now).
    *   **Recommendation**: Implement the **Heartbeat API** approach.

### C. Mount Path Optimization for AWS EFS
*   **Structure**: Use a consistent base path.
    *   Local: `E:\AN-V2\workspace-data\<student-id>`
    *   AWS: `/mnt/efs/workspace-data/<student-id>`
*   **Configuration**: Use an environment variable `WORKSPACE_BASE_PATH`.
    *   Dev: `WORKSPACE_BASE_PATH=./workspace-data`
    *   Prod: `WORKSPACE_BASE_PATH=/mnt/efs`

### D. Security Considerations
*   **Bind Mounts**: Ensure the host directory has restricted permissions so other users on the host (if shared) cannot read it. In a containerized environment (AWS ECS/EKS), this is handled by mounting the EFS volume to the task.
*   **Isolation**: Docker provides namespace isolation. Bind mounts are safe as long as we map unique host paths to each container.

### E. Cleanup Strategy
*   **Frequency**: Run the cleanup job every **1 minute**.
*   **Logic**:
    *   Find students where `workspace_status = 'running'` AND `last_activity < NOW() - 15 minutes`.
    *   For each:
        1.  Stop container.
        2.  Remove container.
        3.  Update DB: `workspace_status = 'stopped'`.
        4.  (Optional) Send notification: "Workspace stopped due to inactivity."

## 3. AWS EFS Migration Path

### Phase 1: Local Development (Current)
*   **Storage**: Local Bind Mounts
*   **Path**: `E:\AN-V2\workspace-data\<student-id>`
*   **Docker Command**: `-v E:\AN-V2\workspace-data\<student-id>:/home/coder/project`

### Phase 2: AWS Deployment
1.  **Infrastructure**: Create an AWS EFS File System.
2.  **Mounting**: Mount the EFS file system to the EC2 instance or ECS Task Definition at `/mnt/efs`.
3.  **Environment**: Set `WORKSPACE_BASE_PATH=/mnt/efs/workspace-data`.
4.  **Code Change**: None needed (if using the env var).
5.  **Data Migration**: Use `rsync` or `aws datasync` to copy local `workspace-data` to the EFS volume if preserving dev data is needed.

### Testing Strategy for EFS
1.  **Mount Verification**: Create a test EC2, mount EFS, and verify read/write.
2.  **Latency Test**: Check if Code-Server performance is acceptable with EFS (EFS can be slower for small file operations like `git status`). *Tip: Use EFS Max I/O mode if needed.*

---

## 4. Implementation Plan

1.  **Database**: Add `workspace_last_activity` column to `students`.
2.  **Backend**:
    *   Update `WorkspaceService` to use `WORKSPACE_BASE_PATH` and bind mounts.
    *   Add `heartbeat` endpoint.
    *   Implement `cleanupWorkspaces` cron job.
3.  **Frontend**:
    *   Call `heartbeat` every minute when workspace is open.
