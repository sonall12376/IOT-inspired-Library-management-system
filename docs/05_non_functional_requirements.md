# Non-Functional Requirements (NFR)
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Performance & Latency
*   **Real-time Propagation Latency:** The end-to-end latency from the physical state change (e.g., student sitting down) to the visual update on the active browser clients must be less than 1.0 second under normal conditions.
*   **API Response Time:** All non-reporting REST API endpoints must respond in less than 200ms (95th percentile) under a load of 100 concurrent requests.
*   **Database Queries:** All seat reservation search queries must execute in less than 50ms by utilizing appropriate compound indexes on MongoDB collections.

### 2. Scalability
*   **Concurrence:** The platform must support up to 5,000 active WebSocket connections simultaneously without performance degradation.
*   **IoT Ingestion Scale:** The MQTT ingestion broker must handle throughput of up to 1,000 MQTT messages per second, corresponding to roughly 10,000 active seat sensors publishing state changes and heartbeats.
*   **Horizontal Scalability:** The backend services must be stateless to allow horizontal scaling behind an Nginx or AWS ALB load balancer.

### 3. Security & Compliance
*   **Data Encryption:**
    *   *In Transit:* All client-to-server communications (HTTPS, WSS) and server-to-MQTT broker communications must be encrypted using TLS 1.3.
    *   *At Rest:* User passwords must be hashed using `bcrypt` with a work factor of 12. Database files should be encrypted at rest using MongoDB's storage engine encryption.
*   **Authorization:** JWT tokens must use HMAC SHA-256 signatures. Secret keys must be managed through environment variables and never committed to source control.
*   **Privacy:** The IoT hardware must NOT capture video, audio, or images. The backend must anonymize user booking logs older than 90 days to protect student privacy.

### 4. Availability & Reliability
*   **Uptime SLA:** The backend systems and dashboards must achieve 99.9% uptime (excluding scheduled maintenance windows).
*   **Data Backup:** The MongoDB database must run automatic daily incremental backups and weekly full backups stored in a physically separate location.
*   **Degraded Mode Operation:** If the MQTT broker or a subset of sensors goes offline, students must still be able to book slots manually, and the floor map must clearly label affected seats as "Offline - Status Unknown" instead of failing to load.

### 5. Usability & Accessibility
*   **Screen Responsiveness:** The web dashboards must be fully responsive, supporting displays from mobile screens (320px width) to large desktop monitors (1920px+).
*   **Accessibility Standards:** The web frontend must comply with WCAG 2.1 Level AA guidelines, ensuring high color contrast for seat statuses, screen-reader friendly labels, and keyboard navigability.
*   **User Interface Performance:** UI updates must feel smooth, utilizing Framer Motion for CSS transitions. We must implement loading skeletons to prevent layout shifts.

### 6. Maintainability & Code Quality
*   **TypeScript:** All backend and frontend code must be written in TypeScript with strict typing enabled.
*   **Code Coverage:** The system must maintain at least 80% code coverage for core business modules (reservation logic, validation helpers, role verifications).
*   **Logging:** All application components must output logs to standard output in JSON format using a structured logger (`winston`). Logs must be classified by severity: `DEBUG`, `INFO`, `WARN`, `ERROR`.
