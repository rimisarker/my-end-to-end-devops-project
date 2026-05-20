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
