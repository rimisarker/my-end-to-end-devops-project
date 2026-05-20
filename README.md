# End-to-End DevOps Project: 3-Tier Production-Ready Deployment

## Phase 1: Local Infrastructure & Kubernetes Cluster Architecture

### Purpose & Objective
The goal of this phase is to establish a robust, production-grade local Kubernetes environment mimicking an on-premises enterprise data center. By utilizing **Windows Subsystem for Linux (WSL2)** and **Kind (Kubernetes in Docker)**, we avoid unnecessary cloud infrastructure costs while preserving the multi-node clustering behavior crucial for real-world deployments.

### Cluster Topology & Architecture
The cluster is provisioned via a declarative YAML configuration with a strict split of responsibilities:
- **1 Control-Plane (Master Node):** Runs the core Kubernetes control components (`kube-apiserver`, `etcd`, `kube-scheduler`, `kube-controller-manager`).
- **2 Worker Nodes (`worker`, `worker2`):** Dedicated compute nodes running application pods, proxies, and monitoring agents. This architecture enables testing high availability (HA), pod anti-affinity, and node failure scenarios.

```mermaid
graph TD
    subhost[Windows 11 Machine with WSL2] --> docker[Docker Engine Backend]
    docker --> master[devops-project-cluster-control-plane Container]
    docker --> worker1[devops-project-cluster-worker Container]
    docker --> worker2[devops-project-cluster-worker2 Container]

Installation & Provisioning Steps
Prerequisites: Ensured Docker Engine is running natively inside the WSL2 Linux distribution without Docker Desktop overhead.

Tooling Binary Installation: Installed kind as the orchestration layer and kubectl as the cluster interaction CLI utility.

3.Declarative Configuration: Defined cluster state in kind-config.yaml:

kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker

4.**Cluster Execution:** Initialized the environment using:
   ```bash
   kind create cluster --config kind-config.yaml --name devops-project-cluster

5.State Verification: Validated cluster operational status:
kubectl get nodes -o wide

### Interview Q&A Deep Dive (Conceptual Knowledge)

#### Q1: Why did you opt for Kind instead of Minikube or Docker Desktop's built-in Kubernetes?
**Answer:** Minikube by default launches a single-node setup where master and worker components share the same physical node, hiding cluster networking and scheduling constraints. Docker Desktop is heavy on system resources (RAM/CPU) and relies on a bulky UI. Kind runs entirely over lightweight Docker containers, allowing us to simulate true **Multi-Node Topologies (1 Master + 2 Workers)** using minimal RAM, which perfectly matches an on-premises/bare-metal deployment scenario.

#### Q2: What happens under the hood when you run `kind create cluster`?
**Answer:** Kind downloads a node image containing all required Kubernetes binaries, configurations, and low-level container runtimes (like `containerd`). It then spins up dedicated standalone Docker containers for each role defined in our `kind-config.yaml`. Kind creates a secure bridge docker network, initializes a `kubeadm` bootstrapper inside the control-plane container, and joins the worker node containers to the newly created API Server.

#### Q3: Since there is no physical cloud load balancer or actual cloud network attached, how do the nodes communicate?
**Answer:** Communication relies on the isolated internal Docker network created by Kind. The `kubelet` service running inside each worker container connects securely to the Kubernetes API server endpoint inside the control-plane container. For pod-to-pod cross-node networking, Kind pre-configures a standard Container Network Interface (CNI) provider based on **Kubenet** or simple routing tables.

## Phase 2: 3-Tier Application Architecture & Containerization



### Purpose & Objective
This phase focuses on the containerization of a loosely coupled 3-tier microservices application. By adhering to the 12-Factor App methodology, configuration is strictly separated from code using environment variables, and services are optimized for minimalist foot-prints using Alpine-based Docker images.

### Application Components
1. **Frontend Tier (Nginx Proxy):** Serves static content via Nginx. It functions as a Reverse Proxy that traps incoming public `/api/*` traffic and routes it securely to the private backend cluster IP.
2. **Backend Tier (Node.js Express API):** Processes presentation layer business logic and orchestrates database transactions over persistent drivers.
3. **Database Tier (MongoDB):** Relational/NoSQL datastore layer isolated within the internal network with dynamic volume mounts for data durability.

### Containerization Strategy & Best Practices
- **Multi-Stage/Minimalist Base Images:** Used `nginx:alpine` and `node:18-alpine` to trim image sizes from ~1GB down to under ~100MB, massively shifting network deployment speeds and reducing vulnerability footprints.
- **Decoupled Architecture Verification:** Written a local `docker-compose.yaml` orchestration configuration to mock microservices discovery, verify DNS entry bindings (e.g., routing traffic from frontend to `backend-service`), and test connection resiliency before transitioning onto Kubernetes manifests.

### Execution Blueprint
1. Build and boot the stack in detached mode: `docker compose up -d --build`
2. Validate local host endpoint reachability: `curl http://localhost:9090`
3. Tear down and free runtime resources: `docker compose down`

---

### Interview Q&A Deep Dive (Phase 2)

#### Q1: Why did you write an Nginx reverse proxy configuration instead of letting the frontend code fetch data directly via the backend's port?
**Answer:** In production environments, exposing backend server ports (like `5000`) directly to the public internet creates massive security vulnerabilities and raises Cross-Origin Resource Sharing (CORS) issues. By using Nginx as a single entry point, the frontend talks to `/api` natively on port `80`, and Nginx securely handles routing to the internal microservice endpoint.

#### Q2: What is the significance of utilizing Alpine-based images in your Dockerfile?
**Answer:** Standard base images contain heavy operating system utilities (shells, package managers, system tools) that are never used by the application runtime. Alpine Linux cuts down the image size drastically. Smaller images mean faster CI/CD pipeline build times, lower disk consumption on Kubernetes nodes, and a significantly smaller attack surface for hackers.
