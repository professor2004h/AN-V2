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
    nodejs \
    npm \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for Data Professional track
RUN pip3 install --no-cache-dir \
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

# Install VS Code extensions
RUN code-server --install-extension ms-python.python \
    && code-server --install-extension ms-python.vscode-pylance \
    && code-server --install-extension dbaeumer.vscode-eslint \
    && code-server --install-extension esbenp.prettier-vscode \
    && code-server --install-extension bradlc.vscode-tailwindcss \
    && code-server --install-extension ms-azuretools.vscode-docker \
    && code-server --install-extension eamodio.gitlens

# Set working directory
WORKDIR /home/coder/project

# Switch back to coder user
USER coder

# Expose port
EXPOSE 8080

CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password"]

