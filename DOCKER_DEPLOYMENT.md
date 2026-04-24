# Docker Deployment Guide

## Overview

This hospital management system is fully containerized with Docker. The setup includes:
- **Backend**: Node.js Express API
- **Frontend**: React with Vite & Nginx
- **Database**: MongoDB
- **Orchestration**: Docker Compose

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB free disk space
- 4GB RAM recommended for comfortable development

## Quick Start

### 1. Clone and Setup Environment

```bash
git clone <repository>
cd hospital-fullstack
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your actual values:

```bash
# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=secure-password

# JWT Secrets
JWT_SECRET=your-jwt-secret
JWT_EMAIL_SECRET=your-jwt-email-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### 4. Verify Services

- Backend API: http://localhost:5000/health
- Frontend: http://localhost:3000
- MongoDB: mongodb://admin:password@localhost:27017

## Available Commands

```bash
# Build images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec backend npm run seed
docker-compose exec backend node src/utils/seeder.js

# Restart services
docker-compose restart

# Remove everything (including volumes)
docker-compose down -v
```

## Building Individual Docker Images

### Backend Image

```bash
cd backend
docker build -t hospital-backend:latest .
docker run -p 5000:5000 --env-file ../.env hospital-backend:latest
```

### Frontend Image

```bash
cd frontend
docker build -t hospital-frontend:latest .
docker run -p 3000:80 hospital-frontend:latest
```

## Production Deployment

### Using Docker Registry

1. **Build and tag images:**
```bash
docker build -t your-registry/hospital-backend:1.0.0 ./backend
docker build -t your-registry/hospital-frontend:1.0.0 ./frontend
```

2. **Push to registry:**
```bash
docker login your-registry
docker push your-registry/hospital-backend:1.0.0
docker push your-registry/hospital-frontend:1.0.0
```

3. **Update docker-compose.yml** with registry images or use override:
```bash
cat > docker-compose.prod.yml <<EOF
version: '3.8'
services:
  backend:
    image: your-registry/hospital-backend:1.0.0
  frontend:
    image: your-registry/hospital-frontend:1.0.0
EOF
```

4. **Deploy:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## CI/CD Integration (Jenkins)

The updated `Jenkinsfile` supports:

1. **Docker image building** - Multi-stage builds for optimization
2. **Image testing** - Verifies images run correctly
3. **Registry push** - Pushes to Docker Hub or private registry
4. **Docker Compose override** - Generates deployment manifests

### Jenkins Setup

1. Add Docker credentials:
   - `docker-registry-url`: Registry URL (e.g., docker.io)
   - `docker-username`: Docker username
   - `docker-password`: Docker password/token

2. Configure Jenkins pipeline from `Jenkinsfile`

3. Images are pushed only on `main` branch

## Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect hospital-fullstack_mongodb_data

# Backup MongoDB data
docker run --rm -v hospital-fullstack_mongodb_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/mongodb-$(date +%Y%m%d).tar.gz -C /data .

# Restore MongoDB data
docker run --rm -v hospital-fullstack_mongodb_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/mongodb-DATE.tar.gz -C /data
```

## Network

All services communicate via `hospital-network` bridge network:
- Backend can reach MongoDB at: `mongodb:27017`
- Frontend can reach Backend at: `http://backend:5000`

## Health Checks

Services have health checks configured:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' hospital-backend

# View health check logs
docker inspect --format='{{json .State.Health}}' hospital-backend | jq
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :5000
sudo lsof -i :3000

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml or .env
```

### Database Connection Issues

```bash
# Check MongoDB connectivity
docker-compose exec backend mongosh mongodb://admin:password@mongodb:27017

# View MongoDB logs
docker-compose logs mongodb
```

### Frontend Cannot Connect to Backend

1. Check backend health: `curl http://localhost:5000/health`
2. Verify CORS settings in backend
3. Check network connectivity: `docker-compose exec frontend curl http://backend:5000/health`

### Out of Disk Space

```bash
# Clean up unused containers, networks, volumes
docker system prune -a

# Remove all volumes (WARNING: deletes data)
docker volume prune
```

## Performance Optimization

### Enable BuildKit (faster builds)

```bash
export DOCKER_BUILDKIT=1
docker-compose build
```

### Resource Limits

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Security Best Practices

1. ✅ Non-root user in containers
2. ✅ Health checks enabled
3. ✅ Environment variables for secrets (use .env file)
4. ✅ Multi-stage builds to reduce image size
5. ✅ .dockerignore to exclude unnecessary files

**For production:**
- Use Docker secrets for sensitive data
- Use private Docker registry
- Implement image scanning for vulnerabilities
- Use read-only root filesystem where possible
- Enable content trust

## Monitoring & Logging

### View Real-time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend --tail 50

# Since specific time
docker-compose logs --since 2024-04-24 backend
```

### Container Metrics

```bash
# CPU and memory usage
docker stats

# Inspect container
docker inspect hospital-backend
```

## Backup & Recovery

### Backup MongoDB

```bash
docker-compose exec mongodb mongodump \
  -u admin -p password \
  --authenticationDatabase admin \
  --archive=/backup/mongo-backup.archive

# Copy from container
docker cp hospital-mongodb:/backup/mongo-backup.archive ./backup/
```

### Restore MongoDB

```bash
docker cp ./backup/mongo-backup.archive hospital-mongodb:/backup/
docker-compose exec mongodb mongorestore \
  -u admin -p password \
  --authenticationDatabase admin \
  --archive=/backup/mongo-backup.archive
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices for Node.js in Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)

---

**Last Updated:** April 2024
**Version:** 1.0.0
