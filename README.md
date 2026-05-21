# 3-Tier End-to-End DevOps Project

## 🏗️ Phase 1: Local Infrastructure & Kubernetes Cluster Architecture

### Purpose & Objective
The goal of this phase is to establish a robust, production-grade local Kubernetes environment mimicking an on-premises enterprise data center. By utilizing Windows Subsystem for Linux (WSL2) and Kind (Kubernetes in Docker), we avoid unnecessary cloud infrastructure costs while preserving the multi-node clustering behavior crucial for real-world deployments.

### Cluster Topology & Architecture
The cluster is provisioned via a declarative YAML configuration with a strict split of responsibilities:
1. **Control-Plane (Master Node):** Runs the core Kubernetes control components (kube-apiserver, etcd, kube-scheduler, kube-controller-manager).
2. **Worker Nodes (worker, worker2):** Dedicated compute nodes running application pods, proxies, and monitoring agents. This architecture enables testing high availability (HA), pod anti-affinity, and node failure scenarios.

```mermaid
graph TD
    subhost[Windows 11 Machine with WSL2] --> docker[Docker Engine Backend]
    docker --> master[devops-project-cluster-control-plane Container]
    docker --> worker1[devops-project-cluster-worker Container]
    docker --> worker2[devops-project-cluster-worker2 Container]

🛠️ Installation & Provisioning Steps
Prerequisites: Ensured Docker Engine is running natively inside the WSL2 Linux distribution without Docker Desktop overhead.

Tooling Binary Installation: Installed kind as the orchestration layer and kubectl as the cluster interaction CLI utility.

3.Declarative Configuration: Defined cluster state in kind-config.yaml:
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker

4.Cluster Execution: Initialized the environment using:
kind create cluster --config kind-config.yaml --name devops-project-cluster

5.State Verification: Validated cluster operational status:
kubectl get nodes -o wide
📋 Interview Q&A Deep Dive (Phase 1)
Q1: Why did you opt for Kind instead of Minikube or Docker Desktop's built-in Kubernetes?
Answer: Minikube by default launches a single-node setup where master and worker components share the same physical node, hiding cluster networking and scheduling constraints. Kind runs entirely over lightweight Docker containers, allowing us to simulate true Multi-Node Topologies (1 Master + 2 Workers) using minimal RAM.

Q2: What happens under the hood when you run kind create cluster?
Answer: Kind downloads a node image containing all required Kubernetes binaries and low-level container runtimes (like containerd). It then spins up dedicated standalone Docker containers for each role defined in our configuration and joins them securely to the API Server.

📦 Phase 2: 3-Tier Application Architecture & Containerization
Purpose & Objective
This phase focuses on the containerization of a loosely coupled 3-tier microservices application. By adhering to the 12-Factor App methodology, configuration is strictly separated from code using environment variables, and services are optimized using Alpine-based Docker images.

Application Components
Frontend Tier (Nginx Proxy): Serves static content via Nginx. It functions as a Reverse Proxy that traps incoming public /api/* traffic and routes it securely to the private backend.

Backend Tier (Node.js Express API): Processes presentation layer business logic and orchestrates database transactions.

Database Tier (MongoDB): NoSQL datastore layer isolated within the internal network with dynamic volume mounts for data durability.

📋 Interview Q&A Deep Dive (Phase 2)
Q1: Why did you write an Nginx reverse proxy configuration instead of letting the frontend talk directly via the backend's port?
Answer: Exposing backend server ports directly to the public internet creates massive security vulnerabilities. By using Nginx as a single entry point, the frontend talks to /api natively on port 80, and Nginx securely handles routing to the internal microservice endpoint.

🚀 Phase 3: CI/CD Pipeline Automation (Jenkins & Trivy)
In this phase, we automated the entire Integration process using Jenkins Declarative Pipeline and secured our build lifecycle using Trivy Vulnerability Scanner.

⚙️ CI Pipeline Architecture & Workflow
1.Source Code Checkout: Jenkins automatically pulls the latest code from GitHub upon every commit on the main branch.

2.Security Scan (Trivy FS): Trivy scans the raw source code repository filesystem for any leaked secrets or high/critical vulnerabilities before building.

3.Docker Image Build: Upon a successful scan, Jenkins builds optimized production-ready Docker images for both Frontend and Backend.

4.Image Vulnerability Scan (Trivy Image): Before pushing, Trivy deeply scans the built container layers to ensure zero vulnerability footprints.

🛠️ How to Run the Pipeline locally
1.Ensure Jenkins is running on your environment (sudo systemctl start jenkins).

2.Make sure the jenkins user has appropriate docker permissions:

sudo usermod -aG docker jenkins
sudo chmod 666 /var/run/docker.sock
sudo systemctl restart jenkins

3.Create a Pipeline Project in Jenkins pointing to this GitHub repository and click "Build Now".
---

## ☸️ Phase 24 Migration to Kubernetes (K8s)

In this phase, the entire 3-tier architecture was migrated from Docker Compose to a local Kubernetes (**Kind**) cluster to leverage enterprise-grade orchestration, self-healing, and declarative infrastructure scaling.

### 🛠️ K8s Key Implementation Details
* **Infrastructure as Code (IaC):** Converted manual setups into declarative K8s manifests (`Deployment` and `Service`).
* **Service Discovery:** Implemented a permanent cluster-internal abstraction layer (`db-service` on port `27017`) to solve dynamic Pod IP and Node.js `EAI_AGAIN` (DNS lookup) routing failures.
* **Local Cluster Access:** Utilized secure `kubectl port-forwarding` to tunnel internal cluster resources directly to the host machine's browser environment.

### 📂 New Manifests Added (under `/k8s`)
* **`mongo-deployment.yaml`**: Coordinates the stateful lifecycle of the MongoDB engine instance.
* **`mongo-service.yaml`**: Provisions a fixed core internal gateway address for secure backend-to-database handshakes.

### 🚀 Commands Used for K8s Deployment & Troubleshooting

1. **Deploying the Database Layer:**
   ```bash
   kubectl apply -f k8s/mongo-deployment.yaml
   kubectl apply -f k8s/mongo-service.yaml
2.Exposing the Topology to Local Browser:
# Terminal 1: Frontend Route Mapping
kubectl port-forward service/frontend-service 8082:80 --address 0.0.0.0

# Terminal 2: Backend API Route Mapping
kubectl port-forward service/backend-service 5000:5000 --address 0.0.0.0




# Automated GitOps CI/CD Pipeline with Jenkins & ArgoCD

This repository demonstrates a production-ready, fully automated **GitOps CI/CD Pipeline** for a Three-Tier application. The pipeline automates everything from security scanning and Docker image building to GitOps-based continuous deployment using Jenkins and ArgoCD on a Kubernetes cluster.

---

## 🏗️ Architecture Overview

The pipeline implements a complete automated feedback loop:

1. **Developer Push:** Developer commits and pushes code to GitHub.
2. **CI Stage (Jenkins):** - Checks out the latest code.
   - Runs a security scan using **Trivy**.
   - Builds and tags backend and frontend Docker images with the unique `BUILD_NUMBER`.
   - Pushes the production-ready images to **Docker Hub**.
3. **Manifest Update:** Jenkins updates the Kubernetes deployment manifests (`k8s/`) with the newly generated image tags and pushes the changes back to GitHub (`[skip ci]`).
4. **GitOps CD Stage (ArgoCD):** ArgoCD detects the manifest changes via Auto-Sync, prunes old resources, self-heals any drift, and pulls the fresh images into the Kubernetes Cluster.

---

## 🛠️ Tech Stack & Tools

- **CI Automation:** Jenkins (Pipeline-as-Code)
- **GitOps CD:** ArgoCD
- **Containerization:** Docker & Docker Hub
- **Orchestration:** Kubernetes (Minikube / Kind)
- **Security:** Trivy (File system scanning)
- **Source Control:** GitHub

---

## 🚀 Pipeline Stages (Jenkinsfile Structure)

### 1. Checkout Code
Pulls the latest source code from the main branch of the GitHub repository.

### 2. Security Scan (Trivy)
Scans the filesystem for high and critical vulnerabilities before building container images to ensure secure shipping.
```bash
trivy fs . --severity HIGH,CRITICAL

3. Build & Push Docker Images
Authenticates with Docker Hub using secure credentials and builds both frontend and backend images.
1.Tags applied: rimisarker/frontend:${BUILD_NUMBER} and rimisarker/backend:${BUILD_NUMBER}

4. Update K8s Manifest & Push to GitHub
The core GitOps step. Jenkins dynamically modifies k8s/backend-deployment.yaml and k8s/frontend-deployment.yaml using sed commands, commits the changes with [skip ci] to prevent infinite build loops, and pushes them back to GitHub.

⚙️ ArgoCD Configuration
To maintain zero-touch automation, the ArgoCD application is configured with the following active sync policies:

1.Automated Sync: Enabled (polls Git repository for tag modifications).

2.Prune Resources: Enabled (automatically removes dead or deleted objects).

3.Self-Heal: Enabled (automatically fixes configuration drifts if manual changes occur inside the cluster).

📋 Prerequisites to Run This Pipeline
1.Jenkins Plugins: Ensure Pipeline, Git, and Credentials Binding plugins are installed.

2.Jenkins Credentials:

I.dockerhub-creds: Username and Password (Token) for Docker Hub.

II.github-creds: Username and Personal Access Token (PAT) with repo scopes for pushing manifest updates.

3.Trivy CLI: Installed on the Jenkins agent machine.

4.ArgoCD: Running inside the Kubernetes cluster and tracking the k8s/ directory of this repo.



## 📊 Infrastructure Monitoring Setup (Prometheus & Grafana)

This section of the project focuses on setting up a lightweight, robust, and real-time monitoring pipeline for our Kubernetes cluster. It ensures high visibility into both node-level resources and individual container behaviors without overloading our system memory.

---

### 🏗️ Monitoring Architecture

The monitoring stack is deployed inside a dedicated `monitoring` namespace and consists of the following components:
* **Prometheus Server:** Collects and stores time-series metrics from the cluster (optimized with a 1GB memory limit and 2-hour retention).
* **Node Exporter:** Scrapes hardware and OS metrics from the Kubernetes nodes (CPU, RAM, Disk, Network).
* **Kube-State-Metrics & cAdvisor:** Listens to the Kubernetes API server and generates metrics about the state of the pods and containers.
* **Grafana:** Visualizes the metrics collected by Prometheus using production-ready dashboards.

---

### 🛠️ Installation & Setup Steps

#### 1. Create the Namespace
```bash
kubectl create namespace monitoring

2. Install Helm (Kubernetes Package Manager)
curl -fsSL -o get_helm.sh [https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3](https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3)
chmod 700 get_helm.sh
./get_helm.sh
rm get_helm.sh

3. Add Helm Repositories
helm repo add prometheus-community [https://prometheus-community.github.io/helm-charts](https://prometheus-community.github.io/helm-charts)
helm repo add grafana [https://grafana.github.io/helm-charts](https://grafana.github.io/helm-charts)
helm repo update
4. Deploy Resource-Optimized Prometheus
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --set alertmanager.enabled=false \
  --set server.retention=2h \
  --set server.resources.limits.memory=1Gi
5. Deploy Grafana
helm install grafana grafana/grafana --namespace monitoring
🌐 Accessing the Dashboards
1. Retrieve Grafana Admin Password
kubectl get secret --namespace monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
2. Port-Forward Grafana Service
kubectl port-forward svc/grafana 3000:80 -n monitoring

Now, open your browser and go to: http://localhost:3000 (Username: admin).

3. Connect Prometheus Data Source
1.Navigate to Connections -> Data Sources -> Add Data Source.

2.Select Prometheus and configure the URL as:
[http://prometheus-server.monitoring.svc.cluster.local:80](http://prometheus-server.monitoring.svc.cluster.local:80)
3.Click Save & Test.



📊 Imported Production Dashboards
To achieve full observability, we imported two official dashboards via Grafana IDs:

Kubernetes Node Monitoring (Grafana ID: 1860)

Features: Real-time tracking of Node CPU utilization, RAM usage, Uptime, and Disk I/O.

Kubernetes Pod/Container Monitoring (Grafana ID: 15760)

Features: Granular insights into individual namespaces (e.g., default, monitoring). Tracks memory limits and actual usage for active application containers (frontend, backend, mongodb).


🛡️ Resource Management & Stability
To prevent WSL2/Kind node crashes on local environments (16GB RAM setups), strict memory boundaries were applied:

1.Prometheus Server memory is rigidly capped at 1.00 GiB.

2.Metrics retention is optimized for 2 hours to keep disk overhead minimal while preserving active session history.
