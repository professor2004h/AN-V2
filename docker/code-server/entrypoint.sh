#!/bin/bash
set -e

# Ensure all required directories exist with correct permissions
mkdir -p /home/coder/.config/code-server
mkdir -p /home/coder/.local/share/code-server

# Fix ownership (in case EFS mount changed it)
chown -R coder:coder /home/coder/.config 2>/dev/null || true
chown -R coder:coder /home/coder/.local 2>/dev/null || true
chmod -R 755 /home/coder/.config 2>/dev/null || true
chmod -R 755 /home/coder/.local 2>/dev/null || true

# Create config file if it doesn't exist
if [ ! -f /home/coder/.config/code-server/config.yaml ]; then
    cat > /home/coder/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${PASSWORD:-apranova123}
cert: false
EOF
    chown coder:coder /home/coder/.config/code-server/config.yaml
fi

# Switch to coder user and execute the command
exec gosu coder "$@"
