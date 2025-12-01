# Dockerfile for custom Code-Server with pre-installed tools
FROM codercom/code-server:latest

USER root

# Install common development tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    nano \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for Data Professional track (using --break-system-packages for container)
RUN pip3 install --no-cache-dir --break-system-packages \
    pandas \
    numpy \
    matplotlib \
    seaborn \
    jupyter \
    jupyterlab \
    sqlalchemy \
    psycopg2-binary \
    requests \
    prefect

# Install Node.js packages for Full-Stack Developer track
RUN npm install -g \
    typescript \
    ts-node \
    @nestjs/cli \
    @angular/cli \
    create-react-app \
    next

# Install VS Code extensions (only open-source extensions available in code-server)
RUN code-server --install-extension ms-python.python || true \
    && code-server --install-extension dbaeumer.vscode-eslint || true \
    && code-server --install-extension esbenp.prettier-vscode || true \
    && code-server --install-extension bradlc.vscode-tailwindcss || true \
    && code-server --install-extension eamodio.gitlens || true \
    && code-server --install-extension formulahendry.auto-close-tag || true \
    && code-server --install-extension formulahendry.auto-rename-tag || true

# Set working directory
WORKDIR /home/coder/project

# Switch back to coder user
USER coder

# Expose port
EXPOSE 8080

CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password"]

