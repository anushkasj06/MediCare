# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Runtime stage with nginx
FROM nginx:1.25-alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a non-root user for nginx
RUN addgroup -g 101 -S nginx && \
    adduser -S nginx -u 101 && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
