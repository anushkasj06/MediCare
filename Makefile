# Makefile for Hospital Management System

.PHONY: help setup build up down logs clean restart ps shell-backend shell-frontend

help:
	@echo "Hospital Management System - Docker Commands"
	@echo "============================================="
	@echo ""
	@echo "Setup & Build:"
	@echo "  make setup          - Setup environment and build images"
	@echo "  make build          - Build Docker images"
	@echo "  make build-backend  - Build backend image only"
	@echo "  make build-frontend - Build frontend image only"
	@echo ""
	@echo "Running Services:"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make ps             - Show running services"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start services in development mode"
	@echo "  make logs           - View logs (all services)"
	@echo "  make logs-backend   - View backend logs"
	@echo "  make logs-frontend  - View frontend logs"
	@echo "  make logs-db        - View database logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make shell-backend  - Open shell in backend container"
	@echo "  make shell-frontend - Open shell in frontend container"
	@echo "  make shell-db       - Open MongoDB shell"
	@echo "  make clean          - Remove containers and volumes"
	@echo "  make prune          - Clean up unused Docker resources"
	@echo ""

setup:
	@echo "Setting up Docker environment..."
	@docker-compose build --no-cache
	@echo "✓ Setup complete"

build:
	@echo "Building Docker images..."
	@docker-compose build

build-backend:
	@echo "Building backend image..."
	@docker-compose build backend

build-frontend:
	@echo "Building frontend image..."
	@docker-compose build frontend

up:
	@echo "Starting services..."
	@docker-compose up -d
	@echo "✓ Services started"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:5000"
	@echo "  MongoDB:  mongodb://localhost:27017"

down:
	@echo "Stopping services..."
	@docker-compose down
	@echo "✓ Services stopped"

restart:
	@echo "Restarting services..."
	@docker-compose restart
	@echo "✓ Services restarted"

ps:
	@docker-compose ps

logs:
	@docker-compose logs -f

logs-backend:
	@docker-compose logs -f backend

logs-frontend:
	@docker-compose logs -f frontend

logs-db:
	@docker-compose logs -f mongodb

dev:
	@echo "Starting services in development mode..."
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✓ Development services started"

shell-backend:
	@docker-compose exec backend /bin/sh

shell-frontend:
	@docker-compose exec frontend /bin/sh

shell-db:
	@docker-compose exec mongodb mongosh -u admin -p password --authenticationDatabase admin

clean:
	@echo "Cleaning up containers and volumes..."
	@docker-compose down -v
	@echo "✓ Cleanup complete"

prune:
	@echo "Pruning unused Docker resources..."
	@docker system prune -f
	@docker volume prune -f
	@echo "✓ Prune complete"

backup-db:
	@echo "Backing up MongoDB..."
	@docker-compose exec -T mongodb mongodump -u admin -p password --authenticationDatabase admin --archive > backup/mongo-backup-$$(date +%Y%m%d-%H%M%S).archive
	@echo "✓ Backup complete"

restore-db:
	@echo "Restoring MongoDB from backup..."
	@docker-compose exec -T mongodb mongorestore -u admin -p password --authenticationDatabase admin --archive < $$(ls -t backup/mongo-backup-*.archive | head -1)
	@echo "✓ Restore complete"
