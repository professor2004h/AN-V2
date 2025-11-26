# ============================================
# OPTIMIZED CODE-SERVER DOCKERFILE FOR AWS FARGATE
# ============================================

FROM codercom/code-server:latest

# Install essential development tools
USER root

# Update and install packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    git \
    curl \
    wget \
    vim \
    nano \
    htop \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install --no-cache-dir --break-system-packages \
    numpy \
    pandas \
    matplotlib \
    seaborn \
    scikit-learn \
    jupyter \
    ipython

# Install Node.js packages globally
RUN npm install -g \
    typescript \
    ts-node \
    nodemon \
    pm2

# Create workspace directory
RUN mkdir -p /home/coder/workspace

# Set up code-server settings for auto-save
RUN mkdir -p /home/coder/.local/share/code-server/User && \
    echo '{\n\
    "files.autoSave": "afterDelay",\n\
    "files.autoSaveDelay": 1000,\n\
    "editor.formatOnSave": true,\n\
    "editor.formatOnPaste": true,\n\
    "workbench.startupEditor": "none",\n\
    "workbench.colorTheme": "Default Dark+",\n\
    "terminal.integrated.defaultProfile.linux": "bash",\n\
    "editor.fontSize": 14,\n\
    "editor.tabSize": 2,\n\
    "editor.wordWrap": "on"\n\
    }' > /home/coder/.local/share/code-server/User/settings.json

# Install popular VS Code extensions
RUN code-server --install-extension ms-python.python && \
    code-server --install-extension dbaeumer.vscode-eslint && \
    code-server --install-extension esbenp.prettier-vscode && \
    code-server --install-extension ms-vscode.vscode-typescript-next && \
    code-server --install-extension formulahendry.code-runner

# Set proper permissions
RUN chown -R coder:coder /home/coder

# Switch back to coder user
USER coder

# Set working directory
WORKDIR /home/coder

# Expose code-server port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

# Start code-server
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password", "/home/coder"]
