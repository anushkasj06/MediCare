pipeline {
  agent any
  options {
    ansiColor('xterm')
    timestamps()
  }
  environment {
    NODE_ENV = 'production'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Build and Package') {
      parallel {
        stage('Backend Build') {
          steps {
            dir('backend') {
              script {
                if (isUnix()) {
                  sh 'npm install'
                  sh 'zip -r ../backend-artifact.zip . -x node_modules/** -x .git/**'
                } else {
                  bat 'npm install'
                  bat 'powershell -Command "Compress-Archive -Path * -DestinationPath ..\\backend-artifact.zip -Force -Exclude node_modules, .git"'
                }
              }
            }
          }
        }
        stage('Frontend Build') {
          steps {
            dir('frontend') {
              script {
                if (isUnix()) {
                  sh 'npm install'
                  sh 'npm run build'
                  sh 'zip -r ../frontend-dist.zip dist'
                } else {
                  bat 'npm install'
                  bat 'npm run build'
                  bat 'powershell -Command "Compress-Archive -Path dist\\* -DestinationPath ..\\frontend-dist.zip -Force"'
                }
              }
            }
          }
        }
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'backend-artifact.zip, frontend-dist.zip', fingerprint: true
      cleanWs()
    }
  }
}
