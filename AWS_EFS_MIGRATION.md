# AWS EFS Migration Guide for Apranova LMS

This guide documents how to migrate the current local bind mount storage strategy to AWS Elastic File System (EFS) for production deployment.

## Current Architecture (Local Dev)
- **Storage**: Local Bind Mounts
- **Path**: `process.cwd() + '/workspace-data/<student-id>'`
- **Docker Command**: `-v <absolute-path>:/home/coder/project`
- **Persistence**: Data is stored on the host machine's filesystem.

## Target Architecture (AWS Production)
- **Storage**: AWS EFS (Elastic File System)
- **Mount Point**: `/mnt/efs` (on EC2 or ECS container instance)
- **Path Structure**: `/mnt/efs/workspace-data/<student-id>`
- **Persistence**: Data is stored in EFS, decoupled from compute instances.

---

## Migration Steps

### 1. Infrastructure Setup (Terraform/Console)

1.  **Create EFS File System**:
    *   Create a new EFS file system in the same VPC as your ECS/EC2 instances.
    *   Create Mount Targets in each Availability Zone (subnet) where your instances run.
    *   Security Group: Allow inbound NFS (port 2049) from your ECS/EC2 Security Group.

2.  **Mount EFS to Compute Instances**:
    *   **EC2**: Add to `/etc/fstab` to mount automatically at `/mnt/efs`.
        ```bash
        fs-xxxxxx.efs.region.amazonaws.com:/ /mnt/efs nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport 0 0
        ```
    *   **ECS (Fargate)**:
        *   Define a Volume in Task Definition:
            ```json
            "volumes": [
              {
                "name": "efs-storage",
                "efsVolumeConfiguration": {
                  "fileSystemId": "fs-xxxxxx",
                  "rootDirectory": "/"
                }
              }
            ]
            ```
        *   **Note**: For dynamic workspace provisioning (Docker-in-Docker or sibling containers), mounting EFS directly to the *host* (EC2) is preferred so the `WorkspaceService` can bind mount subdirectories. Fargate makes this harder because you can't easily run `docker run` with bind mounts to the host. **Recommendation: Use EC2 Launch Type for ECS.**

### 2. Application Configuration

1.  **Environment Variables**:
    Set the `WORKSPACE_BASE_PATH` environment variable in your backend service definition.
    ```bash
    WORKSPACE_BASE_PATH=/mnt/efs/workspace-data
    ```

2.  **Permissions**:
    Ensure the backend service (running as a user, e.g., `node`) has write permissions to `/mnt/efs/workspace-data`.
    ```bash
    sudo mkdir -p /mnt/efs/workspace-data
    sudo chown -R 1000:1000 /mnt/efs/workspace-data
    ```

### 3. Code Changes
**No code changes are required!** The `WorkspaceService` already uses `process.env.WORKSPACE_BASE_PATH`.

### 4. Data Migration (Optional)
If you need to move existing dev data to prod:
1.  **Zip Local Data**: `tar -czf workspace-data.tar.gz workspace-data/`
2.  **Upload to S3**: `aws s3 cp workspace-data.tar.gz s3://my-bucket/`
3.  **Download on Prod**: `aws s3 cp s3://my-bucket/workspace-data.tar.gz .`
4.  **Extract to EFS**: `tar -xzf workspace-data.tar.gz -C /mnt/efs/`

---

## Testing Verification

1.  **Deploy Backend**: Deploy with `WORKSPACE_BASE_PATH=/mnt/efs/workspace-data`.
2.  **Provision Workspace**: Create a workspace for a test student.
3.  **Verify Directory**: Check if `/mnt/efs/workspace-data/<student-id>` is created.
4.  **Verify Persistence**:
    *   Create a file in the workspace (via Code-Server).
    *   Stop the workspace (auto-destroy or manual).
    *   Start the workspace again.
    *   Verify the file still exists.

## Troubleshooting

*   **Permission Denied**: Check EFS mount permissions and UID/GID matching between host and container.
*   **Slow Performance**: Enable "Max I/O" mode on EFS if you have many concurrent workspaces. Consider using EFS Access Points for better isolation.
