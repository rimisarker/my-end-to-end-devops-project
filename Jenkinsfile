pipeline {
    agent any

    // environment ব্
    environment {
        DOCKER_HUB_USER = 'rimisarker' 
        FRONTEND_IMAGE  = "my-frontend-app"
        BACKEND_IMAGE   = "my-backend-app"
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Fetching latest code from GitHub...'
            }
        }

        stage('2. Security Scan (Trivy)') {
            steps {
                echo 'Scanning source code filesystem for vulnerabilities...'
                sh 'trivy fs . --severity HIGH,CRITICAL'
            }
        }

        stage('3. Build Docker Images') {
            steps {
                echo 'Building production-ready Docker images...'
                sh "docker build -t ${DOCKER_HUB_USER}/${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
                sh "docker build -t ${DOCKER_HUB_USER}/${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"
            }
        }

        stage('4. Scan Built Images (Trivy)') {
            steps {
                echo 'Scanning built images before pushing to Registry...'
                sh "trivy image ${DOCKER_HUB_USER}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                sh "trivy image ${DOCKER_HUB_USER}/${BACKEND_IMAGE}:${BUILD_NUMBER}"
            }
        }
    }
}
