@echo off
REM Docker Setup Script for Windows - Automates Docker environment setup

setlocal enabledelayedexpansion

echo.
echo ================== Hospital Management System - Docker Setup ==================
echo.

REM Check prerequisites
echo [1/5] Checking prerequisites...

docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not found. Please install Docker Desktop for Windows.
    exit /b 1
)
echo OK: Docker found

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose not found. Please install Docker Desktop.
    exit /b 1
)
echo OK: Docker Compose found

REM Create environment file
echo [2/5] Setting up environment variables...

if exist .env (
    echo WARNING: .env file already exists. Skipping...
) else (
    copy .env.example .env
    echo OK: Created .env file from template
    echo WARNING: Please edit .env with your actual credentials
)

REM Create docker networks
echo [3/5] Creating Docker network...

docker network inspect hospital-network >nul 2>&1
if errorlevel 1 (
    docker network create hospital-network
    echo OK: Created Docker network
) else (
    echo OK: Network already exists
)

REM Build images
echo [4/5] Building Docker images...

docker-compose build --no-cache
if errorlevel 1 (
    echo ERROR: Failed to build images
    exit /b 1
)
echo OK: Docker images built successfully

REM Verify setup
echo [5/5] Verifying setup...

docker-compose config >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose configuration is invalid
    exit /b 1
)
echo OK: Docker Compose configuration is valid

echo.
echo ================== Docker Setup Completed Successfully ==================
echo.
echo Next steps:
echo 1. Edit .env file with your credentials
echo 2. Run: docker-compose up -d
echo 3. Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend: http://localhost:5000
echo    - MongoDB: mongodb://admin:password@localhost:27017
echo.
echo Useful commands:
echo   docker-compose up -d          - Start services
echo   docker-compose down           - Stop services
echo   docker-compose logs -f        - View logs
echo   docker-compose ps             - Show running services
echo.

endlocal
