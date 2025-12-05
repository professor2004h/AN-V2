#!/bin/bash
set -e

# Get student ID from environment (set by Lambda during task launch)
STUDENT_ID=${STUDENT_ID:-default}

echo "Setting up workspace for student: $STUDENT_ID"

# Create student-specific directory structure on EFS
# The EFS is mounted at /efs-data
EFS_STUDENT_DIR="/efs-data/students/${STUDENT_ID}"

# Create the student's directory if it doesn't exist
mkdir -p "${EFS_STUDENT_DIR}"

# Set ownership to coder user (uid 1000, gid 1000)
chown -R 1000:1000 "${EFS_STUDENT_DIR}"
chmod -R 755 "${EFS_STUDENT_DIR}"

# Ensure the /efs-data/students directory has correct permissions
chown -R 1000:1000 /efs-data/students 2>/dev/null || true
chmod -R 755 /efs-data/students 2>/dev/null || true

echo "Created and set permissions for: ${EFS_STUDENT_DIR}"

# Create project directory as a symlink to student's EFS directory
# Remove existing project directory first
rm -rf /home/coder/project 2>/dev/null || true

# Create the symlink
ln -sf "${EFS_STUDENT_DIR}" /home/coder/project
chown -h 1000:1000 /home/coder/project

echo "Student workspace linked: /home/coder/project -> ${EFS_STUDENT_DIR}"

# Ensure all required directories exist with correct permissions
mkdir -p /home/coder/.config/code-server
mkdir -p /home/coder/.local/share/code-server

# Make sure /home/coder is fully writable
chown -R 1000:1000 /home/coder
chmod -R 755 /home/coder

# Create config file if it doesn't exist
if [ ! -f /home/coder/.config/code-server/config.yaml ]; then
    cat > /home/coder/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${PASSWORD:-apranova123}
cert: false
EOF
    chown 1000:1000 /home/coder/.config/code-server/config.yaml
fi

echo "Starting Code-Server as user coder..."

# Change to a valid directory before starting
cd "${EFS_STUDENT_DIR}"

# Switch to coder user and execute the command with explicit working dir
exec gosu coder "$@"
