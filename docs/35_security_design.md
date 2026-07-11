# Security Design
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document outlines the security architecture, threat mitigations, and compliance rules designed to protect user data and IoT infrastructure.

---

### 1. Threat Modeling & Mitigations

#### 1.1 SQL / NoSQL Injection
*   **Threat:** Attackers send malicious payloads to alter database lookups.
*   **Mitigation:** 
    *   Mongoose schemas strictly enforce type casting.
    *   Avoid using raw MongoDB operators from query inputs: construct queries using explicit variables rather than passing unchecked object bodies: `Booking.find({ studentId })` instead of `Booking.find(req.body)`.
    *   Utilize validation libraries (`Zod`) to parse and sanitize all incoming request bodies.

#### 1.2 IoT Device Hijacking & Telemetry Spoofing
*   **Threat:** Malicious entities intercept or publish fake seat statuses to manipulate reservation quotas.
*   **Mitigation:**
    *   *Broker authentication:* The MQTT broker rejects any connection that does not present a valid MAC address username and unique token.
    *   *Topic ACLs:* ESP32 devices can only publish to their specific topic block. A device with MAC `24:0A:...` cannot publish state updates for a seat bound to MAC `30:B5:...`.
    *   *TLS Transport:* Telemetry is encrypted in transit over port 8883, preventing packet snooping on public school Wi-Fi.

#### 1.3 Denial of Service (DoS) on APIs
*   **Threat:** Scripts bombard `/api/bookings` to block out library slots.
*   **Mitigation:**
    *   Implement API rate limiting using `express-rate-limit`:
        ```typescript
        import rateLimit from 'express-rate-limit';
        export const apiLimiter = rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // Limit each IP to 100 requests per window
          message: "Too many requests, please try again later."
        });
        ```
    *   Enforce daily booking quota restrictions per user identity (Student role limited to 2 active bookings/day).

---

### 2. Encryption Specifications
*   **Data at Rest:** 
    *   User passwords hashed using `bcrypt` (Salt round index = 12).
    *   Mongoose query secrets and JWT signing private keys managed strictly via Docker environments or Vault secrets, never hardcoded.
*   **Data in Transit:**
    *   Browsers connect via TLS 1.3 HTTPS/WSS.
    *   IoT devices connect over TLS-secured MQTT (8883).
*   **Hardware Security (ESP32):**
    *   Production ESP32 devices have their JTAG pins disabled and UART print statements minimized in production builds to prevent memory extraction via physical hardware tapping.
