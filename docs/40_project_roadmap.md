# Project Roadmap & Milestones
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document outlines the development lifecycle, task schedules, and delivery milestones.

---

### 1. Development Milestones Schedule

| Milestone | Phase Title | Focus Area / Key Deliverables | Estimated Schedule | Status |
| :--- | :--- | :--- | :--- | :---: |
| **M1** | Documentation | Complete HLD, LLD, Database designs, security specifications, and design guidelines. | Week 1 | Completed |
| **M2** | Repo Foundation | Scaffold frontend/backend workspaces, configure Docker environments, ESLint, Prettier, and test run script setups. | Week 2 | Planned |
| **M3** | API & Auth Core | Database schema mappings, User auth (JWT), Floor management routes, Seat CRUD APIs, and integration test setup. | Week 3-4 | Planned |
| **M4** | Real-Time Telemetry | Config MQTT listener worker, establish Socket.IO rooms, and connect simulated ESP32 sensors to live updates. | Week 5 | Planned |
| **M5** | User Dashboards | UI development: Interactive SVG floor map, student reservation panels, and librarian overrides. | Week 6-7 | Planned |
| **M6** | System Diagnostics | Build device diagnostic dashboard, background watchdog heartbeats, analytics chart reporting modules, and audit log grids. | Week 8 | Planned |
| **M7** | QA & Security | Execute Unit, Integration, and E2E test runs. Perform dependency scanning, TLS certificate linkages, and load testing. | Week 9 | Planned |
| **M8** | Production Launch | Establish GitHub Actions CI/CD pipelines, configure server VM, secure Nginx reverse proxy mappings, and complete hand-off guide. | Week 10 | Planned |

---

### 2. Critical Path Dependencies
1.  **M2 -> M3 (Scaffolding before Auth API):** Database connections and environment layouts must be fully structured before writing REST logic.
2.  **M3 -> M4 (API Core before Real-Time Ingestion):** Seats and floor database models must exist in MongoDB before the MQTT worker can lookup device bindings and store state status changes.
3.  **M4 -> M5 (Real-Time Ingestion before Map UI):** Socket.IO rooms and event payloads must be validated before writing frontend React state subscriptions to avoid UI rendering crashes.
4.  **M7 -> M8 (QA before Deployment):** Release gates (80%+ code coverage, zero vulnerability reports) must be successfully passed before triggering deployment workflows.
