# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM nginxinc/nginx-unprivileged:alpine-slim AS runtime

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx-unprivileged runs as user 'nginx' (uid 101)
USER nginx

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

EXPOSE 8080
