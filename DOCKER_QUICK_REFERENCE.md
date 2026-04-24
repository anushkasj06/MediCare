# Docker Quick Reference Card

## 🚀 Start Services
```bash
docker-compose up -d
```

## 🛑 Stop Services
```bash
docker-compose down
```

## 📋 Check Status
```bash
docker-compose ps
docker-compose logs -f
```

## 🏗️ Build Images
```bash
docker-compose build
docker-compose build --no-cache  # Force rebuild
```

## 🔧 Development Mode
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## 📊 View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Last 50 lines
docker-compose logs -f backend --tail 50
```

## 🔗 Access Services
```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
MongoDB:   mongodb://admin:password@localhost:27017
Health:    curl http://localhost:5000/health
```

## 💻 Execute Commands
```bash
# Backend commands
docker-compose exec backend npm run seed
docker-compose exec backend node src/utils/seeder.js

# Frontend commands
docker-compose exec frontend npm run build

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password

# Shell access
docker-compose exec backend /bin/sh
docker-compose exec frontend /bin/sh
```

## 🗑️ Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes too
docker-compose down -v

# Clean all unused Docker resources
docker system prune -a

# Remove dangling volumes
docker volume prune
```

## 📦 Push to Registry
```bash
# Login
docker login

# Build with tag
docker build -t your-registry/hospital-backend:1.0.0 ./backend
docker build -t your-registry/hospital-frontend:1.0.0 ./frontend

# Push
docker push your-registry/hospital-backend:1.0.0
docker push your-registry/hospital-frontend:1.0.0
```

## 🔍 Troubleshooting
```bash
# Check container logs
docker-compose logs mongodb

# Inspect service
docker inspect hospital-backend

# Check network
docker network ls
docker network inspect hospital-network

# Test connectivity
docker-compose exec frontend curl http://backend:5000/health
```

## 💾 Backup/Restore
```bash
# Backup MongoDB
docker-compose exec -T mongodb mongodump -u admin -p password --authenticationDatabase admin --archive > backup.archive

# Restore MongoDB
docker-compose exec -T mongodb mongorestore -u admin -p password --authenticationDatabase admin --archive < backup.archive
```

## 📊 Docker Stats
```bash
# View resource usage
docker stats

# View specific container
docker stats hospital-backend
```

## 🛡️ Security
```bash
# Run as non-root (already configured)
# Access specific container
docker exec -u nodejs hospital-backend whoami

# View image layers
docker history hospital-backend:latest
```

## 🔐 Environment Variables
```bash
# Set in .env file
cp .env.example .env
nano .env

# Key variables:
MONGO_USER=admin
MONGO_PASSWORD=password
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:5000
```

## 🚀 Production Deployment
```bash
# Build optimized images
docker build --build-arg NODE_ENV=production -t hospital-backend:prod ./backend
docker build --build-arg NODE_ENV=production -t hospital-frontend:prod ./frontend

# Use production compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check health
docker-compose ps
curl http://localhost:5000/health
```

## 📝 Make Commands (if using Makefile)
```bash
make setup       # Initial setup
make up          # Start services
make down        # Stop services
make dev         # Development mode
make logs        # View logs
make clean       # Remove everything
make ps          # Show status
make build       # Build images
make shell-backend  # Access backend shell
make backup-db   # Backup database
make restore-db  # Restore database
```

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `docker-compose down` or change BACKEND_PORT in .env |
| MongoDB won't start | Check MONGO_PASSWORD is set in .env |
| Frontend can't reach backend | Check backend is running: `docker-compose ps` |
| Out of disk space | `docker system prune -a` |
| Images not updating | Use `docker-compose build --no-cache` |
| Container keeps restarting | Check logs: `docker-compose logs service-name` |
| Permission denied | Ensure Docker daemon is running, user in docker group |

## 📚 File Locations
```
Root Directory:
  .env                    ← Environment variables
  docker-compose.yml      ← Main configuration
  docker-compose.dev.yml  ← Development overrides
  docker-compose.prod.yml ← Production overrides
  
Backend:
  backend/Dockerfile      ← Backend build recipe
  backend/.dockerignore   ← Exclude files from build
  
Frontend:
  frontend/Dockerfile     ← Frontend build recipe
  frontend/nginx.conf     ← Nginx configuration
  frontend/.dockerignore  ← Exclude files from build
```

## 🔗 Useful Links
- Docker Docs: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/compose-file/
- Node.js Best Practices: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
- Nginx: https://nginx.org/
- MongoDB: https://docs.mongodb.com/

---
**Print this card and keep it handy!** 📌
