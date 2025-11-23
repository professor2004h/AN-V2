FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Install Docker CLI for workspace management
RUN apk add --no-cache docker-cli

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./

# Install production dependencies only
RUN npm install --only=production

# Create workspace-data directory with correct permissions
RUN mkdir -p workspace-data && chown -R expressjs:nodejs workspace-data

# We need to run as root to access /var/run/docker.sock unless we configure permissions carefully
# For simplicity in this setup, we'll run as root, but in a strict production env, 
# we'd add the user to the docker group.
# However, the docker group ID on the host might differ.
# Running as root inside the container is the most reliable way to access the mounted socket.
# USER expressjs 

EXPOSE 3001

CMD ["node", "dist/index.js"]
