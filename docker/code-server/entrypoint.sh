#!/bin/bash
set -e

STUDENT_ID=${STUDENT_ID:-default}
echo "===== Code-Server Workspace Setup ====="
echo "Student ID: $STUDENT_ID"

# EFS paths
EFS_STUDENT_DIR="/efs-data/students/${STUDENT_ID}"
EFS_VSCODE_DIR="/home/coder/.local/share/code-server"
EFS_EXTENSIONS_DIR="${EFS_STUDENT_DIR}/.vscode-extensions"

# Create student directory on EFS
mkdir -p "${EFS_STUDENT_DIR}"
mkdir -p "${EFS_EXTENSIONS_DIR}"
chown -R 1000:1000 "${EFS_STUDENT_DIR}" 2>/dev/null || true
chmod -R 755 "${EFS_STUDENT_DIR}" 2>/dev/null || true
echo "Created EFS directory: ${EFS_STUDENT_DIR}"

# Symlink /home/coder/project to student EFS directory
rm -rf /home/coder/project 2>/dev/null || true
ln -sf "${EFS_STUDENT_DIR}" /home/coder/project
chown -h 1000:1000 /home/coder/project
echo "Symlink: /home/coder/project -> EFS"

# Create required directories
mkdir -p /home/coder/.config/code-server
mkdir -p "${EFS_VSCODE_DIR}/User"

# Symlink extensions to EFS (persistent!)
rm -rf "${EFS_VSCODE_DIR}/extensions" 2>/dev/null || true
mkdir -p "${EFS_EXTENSIONS_DIR}"
ln -sf "${EFS_EXTENSIONS_DIR}" "${EFS_VSCODE_DIR}/extensions"
chown -h 1000:1000 "${EFS_VSCODE_DIR}/extensions" 2>/dev/null || true
echo "Extensions directory: EFS (persistent)"

# VS Code settings with auto-save
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
    "git.enableSmartCommit": true,
    "workbench.colorTheme": "Default Dark Modern",
    "editor.fontSize": 14,
    "editor.tabSize": 2,
    "editor.wordWrap": "on",
    "editor.minimap.enabled": false,
    "terminal.integrated.scrollback": 10000,
    "files.exclude": {
        "**/node_modules": true,
        "**/__pycache__": true,
        "**/.git": false
    },
    "telemetry.telemetryLevel": "off"
}
SETTINGS
chown 1000:1000 "${EFS_VSCODE_DIR}/User/settings.json" 2>/dev/null || true

# Code-server config
cat > /home/coder/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${PASSWORD:-apranova123}
cert: false
user-data-dir: ${EFS_VSCODE_DIR}
EOF

# Set permissions
chown -R 1000:1000 /home/coder 2>/dev/null || true

echo "====================================="
echo "Student ID: $STUDENT_ID"
echo "Project: /home/coder/project (EFS)"
echo "Auto-save: Every 1 second"
echo "====================================="

cd /home/coder/project
exec gosu coder code-server --bind-addr 0.0.0.0:8080 /home/coder/project