# Code-Server Workspace Setup

This directory contains the Docker configuration for browser-based IDE workspaces using Code-Server.

## Features

- **Full VS Code Experience**: Browser-based VS Code with all extensions
- **Pre-installed Tools**:
  - Python 3 with data science libraries (pandas, numpy, matplotlib, etc.)
  - Node.js with modern frameworks (React, Next.js, NestJS)
  - PostgreSQL client
  - Git and version control tools
  - Jupyter Lab for data analysis

## Building the Image

```bash
cd docker/code-server
docker build -t apranova/code-server:latest .
```

## Running a Workspace

### For a Single Student

```bash
docker run -d \
  --name student-workspace-{student_id} \
  -p 8080:8080 \
  -e PASSWORD=secure_password \
  -v student-{student_id}-data:/home/coder/project \
  apranova/code-server:latest
```

### Using Docker Compose

```bash
# Start the template workspace
docker-compose --profile workspace up -d code-server-template
```

## Dynamic Workspace Provisioning

The backend API will handle dynamic workspace creation:

1. Student requests workspace
2. Backend creates Docker container with unique port
3. Container URL is saved to database
4. Student accesses workspace via unique URL
5. Auto-shutdown after inactivity (configurable timeout)

## Workspace Management

### List All Workspaces

```bash
docker ps --filter "name=student-workspace"
```

### Stop a Workspace

```bash
docker stop student-workspace-{student_id}
```

### Remove a Workspace

```bash
docker rm student-workspace-{student_id}
docker volume rm student-{student_id}-data
```

## Security Considerations

- Each workspace has a unique password
- Workspaces are isolated from each other
- Network policies restrict inter-workspace communication
- Auto-shutdown prevents resource waste
- Regular backups of student work

## Resource Limits

Recommended limits per workspace:
- CPU: 1-2 cores
- Memory: 2-4 GB
- Storage: 10-20 GB

## Monitoring

- Track workspace uptime
- Monitor resource usage
- Alert on high resource consumption
- Auto-scale based on demand

