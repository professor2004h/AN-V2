#!/bin/bash
set -e

STUDENT_ID=${STUDENT_ID:-default}
echo "Setting up workspace for student: $STUDENT_ID"

# EFS mount and student directory
EFS_STUDENT_DIR="/efs-data/students/${STUDENT_ID}"
mkdir -p "${EFS_STUDENT_DIR}"
chown -R 1000:1000 "${EFS_STUDENT_DIR}"
chmod -R 755 "${EFS_STUDENT_DIR}"
chown -R 1000:1000 /efs-data/students 2>/dev/null || true
echo "Created EFS directory: ${EFS_STUDENT_DIR}"

# Symlink /home/coder/project to EFS
rm -rf /home/coder/project 2>/dev/null || true
ln -sf "${EFS_STUDENT_DIR}" /home/coder/project
chown -h 1000:1000 /home/coder/project
echo "Symlink: /home/coder/project -> ${EFS_STUDENT_DIR}"

# Create required directories
mkdir -p /home/coder/.config/code-server
mkdir -p /home/coder/.local/share/code-server
mkdir -p /home/coder/.local/share/code-server/User

# VS Code settings: Auto-save every 1 second, default folder is /home/coder/project
cat > /home/coder/.local/share/code-server/User/settings.json << 'SETTINGS'
{
    "files.autoSave": "afterDelay",
    "files.autoSaveDelay": 1000,
    "window.restoreWindows": "all",
    "workbench.startupEditor": "none",
    "files.hotExit": "onExitAndWindowClose",
    "editor.formatOnSave": true,
    "terminal.integrated.cwd": "/home/coder/project",
    "explorer.confirmDelete": false,
    "git.autofetch": true,
    "files.exclude": {
        "**/node_modules": true,
        "**/.git": false
    }
}
SETTINGS

# Code-server config
cat > /home/coder/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${PASSWORD:-apranova123}
cert: false
user-data-dir: /home/coder/.local/share/code-server
EOF

# Set permissions
chown -R 1000:1000 /home/coder
chmod -R 755 /home/coder

echo "Auto-save enabled: 1 second delay"
echo "Default folder: /home/coder/project"
echo "Starting Code-Server..."

cd /home/coder/project
exec gosu coder code-server --bind-addr 0.0.0.0:8080 /home/coder/project