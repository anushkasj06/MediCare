#!/bin/bash
# Docker Setup Script - Automates Docker environment setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏥 Hospital Management System - Docker Setup${NC}"
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}[1/5]${NC} Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found: $(docker-compose --version)${NC}"

# Create environment file
echo -e "${YELLOW}[2/5]${NC} Setting up environment variables..."

if [ -f .env ]; then
    echo -e "${YELLOW}⚠  .env file already exists. Skipping...${NC}"
else
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
    echo -e "${YELLOW}⚠  Please edit .env with your actual credentials${NC}"
fi

# Create docker networks
echo -e "${YELLOW}[3/5]${NC} Creating Docker network..."

if docker network inspect hospital-network &> /dev/null; then
    echo -e "${GREEN}✓ Network hospital-network already exists${NC}"
else
    docker network create hospital-network
    echo -e "${GREEN}✓ Created Docker network: hospital-network${NC}"
fi

# Build images
echo -e "${YELLOW}[4/5]${NC} Building Docker images..."

docker-compose build --no-cache
echo -e "${GREEN}✓ Docker images built successfully${NC}"

# Verify setup
echo -e "${YELLOW}[5/5]${NC} Verifying setup..."

docker-compose config > /dev/null 2>&1
echo -e "${GREEN}✓ Docker Compose configuration is valid${NC}"

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Docker setup completed successfully!"
echo "=================================================="
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit .env file with your credentials"
echo "2. Run: docker-compose up -d"
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:5000"
echo "   - MongoDB: mongodb://admin:password@localhost:27017"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  docker-compose up -d          - Start services"
echo "  docker-compose down           - Stop services"
echo "  docker-compose logs -f        - View logs"
echo "  docker-compose ps             - Show running services"
echo ""
