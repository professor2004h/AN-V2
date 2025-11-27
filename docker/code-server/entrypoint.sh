#!/bin/bash
set -e

# Get student ID and workspace path from environment
STUDENT_ID=${STUDENT_ID:-"default"}
WORKSPACE_PATH=${WORKSPACE_PATH:-"/workspaces/${STUDENT_ID}"}

echo "Starting code-server for student: ${STUDENT_ID}"
echo "Workspace path: ${WORKSPACE_PATH}"

# Create student-specific workspace directory if it doesn't exist
mkdir -p "${WORKSPACE_PATH}"

# Set ownership to coder user
chown -R coder:coder "${WORKSPACE_PATH}"

# Create a welcome file if this is a new workspace
if [ ! -f "${WORKSPACE_PATH}/README.md" ]; then
    cat > "${WORKSPACE_PATH}/README.md" << 'EOF'
# Welcome to Your Apranova LMS Workspace!

This is your personal development environment with:
- **Auto-save enabled**: Files save automatically 1 second after you stop typing
- **Python 3.11** with popular data science libraries
- **Node.js 20** with npm
- **Git** for version control
- **VS Code extensions** pre-installed

## Getting Started

1. Create a new file or folder
2. Start coding - your work is automatically saved!
3. Use the integrated terminal for running commands

## Pre-installed Tools

- Python: `python3 --version`
- Node.js: `node --version`
- Git: `git --version`

Happy coding! 🚀
EOF
    chown coder:coder "${WORKSPACE_PATH}/README.md"
fi

# Start code-server as coder user
# Use proxy-domain to tell code-server it's behind a reverse proxy
# This ensures redirects (like after login) use the correct path
exec gosu coder code-server \
    --bind-addr 0.0.0.0:8080 \
    --auth password \
    --proxy-domain "apranova-lms-alb-1990266756.us-east-1.elb.amazonaws.com/api/proxy/workspace/${STUDENT_ID}" \
    --disable-telemetry \
    --disable-update-check \
    "${WORKSPACE_PATH}"
