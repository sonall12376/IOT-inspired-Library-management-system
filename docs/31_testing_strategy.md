# Testing Strategy
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document establishes the Quality Assurance (QA) standards, release gate rules, and testing strategies for the SmartLibrary AI application.

---

### 1. Test Pyramid & Goals
SmartLibrary AI adopts a standard three-tier testing hierarchy to balance speed, coverage, and integration verification.

```
       / \
      /   \      E2E Tests (Cypress/Playwright) - ~10%
     / E2E \
    /───────\
   /  INTEG  \   Integration Tests (Supertest, Mocks) - ~30%
  /───────────\
 /    UNIT     \ Unit Tests (Jest / Vitest) - ~60%
/───────────────\
```

*   **Unit Tests:** Target pure business functions (e.g., date-range checking, password validation, coordinate grids processing).
*   **Integration Tests:** Verify module boundaries, database interactions, API endpoint routes, and MQTT/Socket.IO message transformations.
*   **End-to-End (E2E) Tests:** Validate full visual user paths, authentication redirection, and real-time state broadcasts.

---

### 2. Quality Metrics & Release Gates
To approve a code bundle for production deployment, the following metrics must be satisfied in the CI/CD pipeline run:

1.  **Code Coverage:**
    *   Minimum **80% Statement Coverage** across backend and frontend repositories.
    *   Minimum **90% Branch Coverage** in critical business controllers (Booking and Auth services).
2.  **Linting & Style:**
    *   Zero ESLint errors.
    *   Zero Prettier compliance alerts.
3.  **Security Scanning:**
    *   Zero high or critical vulnerability findings in dependency scans (using `npm audit` or Snyk).
4.  **Performance Gate:**
    *   WebSocket broadcast latency must not exceed 1.0 second for 500 concurrent connections under test simulation.
