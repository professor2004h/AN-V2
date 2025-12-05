#!/bin/bash
set -e

STUDENT_ID=${STUDENT_ID:-default}
echo "Setting up workspace for student: $STUDENT_ID"

# EFS paths
EFS_STUDENT_DIR="/efs-data/students/${STUDENT_ID}"
EFS_VSCODE_DIR="/home/coder/.local/share/code-server"
EFS_STUDENT_VSCODE="${EFS_STUDENT_DIR}/.vscode-settings"

# Create student directory on EFS
mkdir -p "${EFS_STUDENT_DIR}"
chown -R 1000:1000 "${EFS_STUDENT_DIR}"
chmod -R 755 "${EFS_STUDENT_DIR}"
echo "Created EFS directory: ${EFS_STUDENT_DIR}"

# Create VS Code settings directory on EFS (persisted!)
mkdir -p "${EFS_STUDENT_VSCODE}"
chown -R 1000:1000 "${EFS_STUDENT_VSCODE}"

# Symlink /home/coder/project to student EFS directory
rm -rf /home/coder/project 2>/dev/null || true
ln -sf "${EFS_STUDENT_DIR}" /home/coder/project
chown -h 1000:1000 /home/coder/project
echo "Symlink: /home/coder/project -> ${EFS_STUDENT_DIR}"

# Create required directories
mkdir -p /home/coder/.config/code-server
mkdir -p "${EFS_VSCODE_DIR}/User"

# VS Code settings with auto-save (stored on EFS!)
cat > "${EFS_VSCODE_DIR}/User/settings.json" << 'SETTINGS'
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
    "workbench.colorTheme": "Default Dark Modern",
    "editor.fontSize": 14,
    "editor.tabSize": 2,
    "files.exclude": {
        "**/node_modules": true,
        "**/.git": false
    }
}
SETTINGS
chown 1000:1000 "${EFS_VSCODE_DIR}/User/settings.json"

# Code-server config
cat > /home/coder/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${PASSWORD:-apranova123}
cert: false
user-data-dir: ${EFS_VSCODE_DIR}
EOF

# Set permissions
chown -R 1000:1000 /home/coder
chmod -R 755 /home/coder

echo "============================================"
echo "Student ID: $STUDENT_ID"
echo "Project folder: /home/coder/project (EFS)"
echo "VS Code settings: ${EFS_VSCODE_DIR} (EFS - PERSISTED!)"
echo "Auto-save: Every 1 second"
echo "============================================"

cd /home/coder/project
exec gosu coder code-server --bind-addr 0.0.0.0:8080 /home/coder/project