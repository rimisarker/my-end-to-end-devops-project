pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'rimisarker' 
        FRONTEND_IMAGE  = "frontend"
        BACKEND_IMAGE   = "backend"
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

        stage('3. Build & Push Docker Images') {
            steps {
                echo 'Building and Pushing production-ready Docker images using Token...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    
                    // টোকেন দিয়ে ডকার হাবে লগইন
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    
                    // বিল্ড (সঠিক নাম ও জেনকিন্স বিল্ড নাম্বার ট্যাগ দিয়ে)
                    sh "docker build -t ${DOCKER_HUB_USER}/${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
                    sh "docker build -t ${DOCKER_HUB_USER}/${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"
                    
                    // ডকার হাবে পুশ
                    sh "docker push ${DOCKER_HUB_USER}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_HUB_USER}/${BACKEND_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }
    }
}
