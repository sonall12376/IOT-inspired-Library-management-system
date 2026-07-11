# DevOps & CI/CD Plan
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document outlines the automation strategy for code quality linting, test execution, building, and continuous delivery of SmartLibrary AI services.

---

### 1. CI/CD Architecture Flow

```
[Developer pushes code to branch]
              │
              ▼
    [GitHub Actions Pipeline]
              │
   ┌──────────┴──────────┐
   ▼                     ▼
[Linting & Prettier]  [Test Suite Execution]
(ESLint, Stylelint)   (Vitest & Jest Runs)
   │                     │
   └──────────┬──────────┘
              ▼
     [Branch Merge to main]
              │
              ▼
    [CD Release Pipeline]
              │
              ▼
  [Build Docker Containers]
 (Frontend, Backend, Ingestion)
              │
              ▼
   [Push to Container Registry]
    (GitHub Packages / DockerHub)
              │
              ▼
    [Deploy to Server VM]
  (Docker Compose pull & reload)
```

---

### 2. GitHub Actions CI Configuration (`.github/workflows/ci.yml`)

The CI workflow is configured to run on all pull requests targeting `main` and `develop` branches:

*   **Setup Environment:** Spawns Node.js 20 environment.
*   **Install Dependencies:** Installs packages using cached locks (`npm ci`).
*   **Format Check:** Verifies style formatting using `npm run format:check`.
*   **Linting:** Runs ESLint static analysis tools: `npm run lint`.
*   **Unit & Integration Tests:** Launches the virtual MongoDB Memory Server and executes test suites: `npm run test:cov`.

---

### 3. Continuous Deployment (CD) Setup
Upon a successful merge to `main`:
1.  **Build Phase:** GitHub Actions runner compiles the React production bundle, embeds it into an Nginx static image, and builds the Node.js TypeScript container.
2.  **Container Tagging:** Containers are tagged with the short git commit SHA and `latest`.
3.  **Deployment Trigger:** The runner SSHs into the production Linux VM using secure keys and runs:
    ```bash
    cd /opt/smartlibrary-ai
    docker compose pull
    docker compose up -d --remove-orphans
    ```
4.  **Verification:** A health check probe verifies the backend `/healthz` API endpoint returns `200 OK`. If the check fails, the deployment rolls back automatically to the previous container tags.
