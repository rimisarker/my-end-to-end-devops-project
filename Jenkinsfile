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
                echo 'Fetching latest code from GitHub repository...'
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
                echo 'Building and pushing production-ready Docker images using token authentication...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {

                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"

                    sh "docker build -t ${DOCKER_HUB_USER}/${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
                    sh "docker build -t ${DOCKER_HUB_USER}/${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"

                    sh "docker push ${DOCKER_HUB_USER}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_HUB_USER}/${BACKEND_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }

        stage('4. Update K8s Manifest & Push to GitHub') {
            steps {
                echo 'Updating Kubernetes deployment manifests with the newly generated image tag...'
                script {
                    sh "sed -i 's|${DOCKER_HUB_USER}/${BACKEND_IMAGE}:.*|${DOCKER_HUB_USER}/${BACKEND_IMAGE}:${BUILD_NUMBER}|g' k8s/backend-deployment.yaml"
                    sh "sed -i 's|${DOCKER_HUB_USER}/${FRONTEND_IMAGE}:.*|${DOCKER_HUB_USER}/${FRONTEND_IMAGE}:${BUILD_NUMBER}|g' k8s/frontend-deployment.yaml"
                    
                    // 👇 !!! CHANGE 'github-creds' IN THE LINE BELOW !!!
                    withCredentials([usernamePassword(credentialsId: 'github-creds', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                        
                        sh "git config user.email 'jenkins@devops.com'"
                        sh "git config user.name 'Jenkins CI'"
                        
                        // 👇 !!! CHANGE 'your-repo-name' IN THE LINE BELOW !!!
                        sh "git remote set-url origin https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/${GIT_USERNAME}/my-end-to-end-devops-project"
                        
                        sh "git add k8s/backend-deployment.yaml k8s/frontend-deployment.yaml"
                        sh "git commit -m 'chore: update application image tags to build ${env.BUILD_NUMBER} [skip ci]'"
                        sh "git push origin HEAD:main"
                    }
                }
            }
        }
    }
}
