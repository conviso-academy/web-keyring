# Stage 1: Build
FROM node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM nginxinc/nginx-unprivileged:alpine-slim@sha256:23f401245140a5b25bc3f979f51b7e0655fdaa504309f95b837ef8feba30d26b AS runtime

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx-unprivileged runs as user 'nginx' (uid 101)
USER nginx

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ || exit 1

EXPOSE 8080
