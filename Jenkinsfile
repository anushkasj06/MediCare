pipeline {
  agent any
  
  options {
    ansiColor('xterm')
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
    timeout(time: 1, unit: 'HOURS')
  }
  
  environment {
    NODE_ENV = 'production'
    DOCKER_REGISTRY = credentials('docker-registry-url')  // e.g., docker.io or your private registry
    DOCKER_USERNAME = credentials('docker-username')
    DOCKER_PASSWORD = credentials('docker-password')
    IMAGE_TAG = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"
    BACKEND_IMAGE = "${DOCKER_REGISTRY}/hospital-backend"
    FRONTEND_IMAGE = "${DOCKER_REGISTRY}/hospital-frontend"
    COMPOSE_PROJECT_NAME = 'hospital-app'
  }
  
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_COMMIT_MSG = sh(returnStdout: true, script: 'git log -1 --pretty=%B').trim()
          echo "✓ Repository checked out - Commit: ${GIT_COMMIT_MSG}"
        }
      }
    }
    
    stage('Validate Docker Setup') {
      steps {
        script {
          echo "🐳 Validating Docker setup..."
          if (isUnix()) {
            sh 'docker --version'
            sh 'docker-compose --version'
          } else {
            bat 'docker --version'
            bat 'docker-compose --version'
          }
        }
      }
    }

    stage('Build Docker Images') {
      parallel {
        stage('Build Backend Image') {
          steps {
            script {
              echo "🔨 Building backend Docker image..."
              if (isUnix()) {
                sh '''
                  cd backend
                  docker build \
                    --build-arg NODE_ENV=production \
                    -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                    -t ${BACKEND_IMAGE}:latest \
                    .
                  echo "✓ Backend image built successfully"
                  docker images ${BACKEND_IMAGE}
                '''
              } else {
                bat '''
                  cd backend
                  docker build ^
                    --build-arg NODE_ENV=production ^
                    -t %BACKEND_IMAGE%:%IMAGE_TAG% ^
                    -t %BACKEND_IMAGE%:latest ^
                    .
                '''
              }
            }
          }
        }

        stage('Build Frontend Image') {
          steps {
            script {
              echo "🔨 Building frontend Docker image..."
              if (isUnix()) {
                sh '''
                  cd frontend
                  docker build \
                    --build-arg NODE_ENV=production \
                    -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                    -t ${FRONTEND_IMAGE}:latest \
                    .
                  echo "✓ Frontend image built successfully"
                  docker images ${FRONTEND_IMAGE}
                '''
              } else {
                bat '''
                  cd frontend
                  docker build ^
                    --build-arg NODE_ENV=production ^
                    -t %FRONTEND_IMAGE%:%IMAGE_TAG% ^
                    -t %FRONTEND_IMAGE%:latest ^
                    .
                '''
              }
            }
          }
        }
      }
    }

    stage('Test Docker Images') {
      steps {
        script {
          echo "✓ Testing Docker images..."
          if (isUnix()) {
            sh '''
              # Test backend image exists and can run
              docker run --rm ${BACKEND_IMAGE}:${IMAGE_TAG} node --version
              # Test frontend image exists
              docker image inspect ${FRONTEND_IMAGE}:${IMAGE_TAG} > /dev/null
              echo "✓ All Docker images verified"
            '''
          } else {
            bat '''
              REM Test backend image
              docker run --rm %BACKEND_IMAGE%:%IMAGE_TAG% node --version
              REM Test frontend image
              docker image inspect %FRONTEND_IMAGE%:%IMAGE_TAG%
              echo ✓ All Docker images verified
            '''
          }
        }
      }
    }

    stage('Push Docker Images') {
      when {
        branch 'main'  // Only push on main branch
      }
      steps {
        script {
          echo "📤 Pushing Docker images to registry..."
          if (isUnix()) {
            sh '''
              # Login to Docker registry
              echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
              
              # Push backend image
              docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
              docker push ${BACKEND_IMAGE}:latest
              
              # Push frontend image
              docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
              docker push ${FRONTEND_IMAGE}:latest
              
              # Logout
              docker logout
              echo "✓ Images pushed successfully"
            '''
          } else {
            bat '''
              REM Login to Docker registry
              echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin
              
              REM Push backend image
              docker push %BACKEND_IMAGE%:%IMAGE_TAG%
              docker push %BACKEND_IMAGE%:latest
              
              REM Push frontend image
              docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
              docker push %FRONTEND_IMAGE%:latest
              
              REM Logout
              docker logout
              echo ✓ Images pushed successfully
            '''
          }
        }
      }
    }

    stage('Generate Compose File') {
      steps {
        script {
          echo "📋 Generating docker-compose override file..."
          if (isUnix()) {
            sh '''
              cat > docker-compose.override.yml <<EOF
version: '3.8'
services:
  backend:
    image: ${BACKEND_IMAGE}:${IMAGE_TAG}
  frontend:
    image: ${FRONTEND_IMAGE}:${IMAGE_TAG}
EOF
              cat docker-compose.override.yml
            '''
          } else {
            bat '''
              (
                echo version: '3.8'
                echo services:
                echo   backend:
                echo     image: %BACKEND_IMAGE%:%IMAGE_TAG%
                echo   frontend:
                echo     image: %FRONTEND_IMAGE%:%IMAGE_TAG%
              ) > docker-compose.override.yml
              type docker-compose.override.yml
            '''
          }
        }
      }
    }

    stage('Archive Artifacts') {
      steps {
        script {
          echo "📦 Archiving artifacts..."
          if (isUnix()) {
            sh '''
              # Create artifact manifest
              cat > image-manifest.txt <<EOF
Build Information:
- Build Number: ${BUILD_NUMBER}
- Build Tag: ${IMAGE_TAG}
- Backend Image: ${BACKEND_IMAGE}:${IMAGE_TAG}
- Frontend Image: ${FRONTEND_IMAGE}:${IMAGE_TAG}
- Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')

To deploy, use:
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
EOF
              cat image-manifest.txt
            '''
          } else {
            bat '''
              REM Create artifact manifest
              (
                echo Build Information:
                echo - Build Number: %BUILD_NUMBER%
                echo - Build Tag: %IMAGE_TAG%
                echo - Backend Image: %BACKEND_IMAGE%:%IMAGE_TAG%
                echo - Frontend Image: %FRONTEND_IMAGE%:%IMAGE_TAG%
                echo - Timestamp: %date%
                echo.
                echo To deploy, use:
                echo docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
              ) > image-manifest.txt
              type image-manifest.txt
            '''
          }
        }
      }
    }
  }

  post {
    always {
      script {
        if (isUnix()) {
          sh 'docker image prune -f --filter "until=72h" || true'
        } else {
          bat 'docker image prune -f --filter "until=72h" || exit /b 0'
        }
      }
      cleanWs(deleteDirs: true, patterns: [
        [pattern: 'docker-compose.override.yml', type: 'INCLUDE'],
        [pattern: 'image-manifest.txt', type: 'INCLUDE']
      ])
    }
    
    success {
      script {
        echo "✅ Pipeline completed successfully"
        // Optional: Send notification
        // mail(to: 'team@hospital.com', subject: "Build #${BUILD_NUMBER} successful", 
        //      body: "Backend: ${BACKEND_IMAGE}:${IMAGE_TAG}\nFrontend: ${FRONTEND_IMAGE}:${IMAGE_TAG}")
      }
    }
    
    failure {
      script {
        echo "❌ Pipeline failed"
        // Optional: Send failure notification
        // mail(to: 'team@hospital.com', subject: "Build #${BUILD_NUMBER} failed", body: "Check logs")
      }
    }
  }
}
