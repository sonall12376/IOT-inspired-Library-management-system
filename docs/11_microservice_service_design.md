# Service Design (Modular Architecture)
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. High-Level Modular Monolith Design
Although deployed as a single runtime process to minimize initial infrastructure complexity, SmartLibrary AI is designed as a **Modular Monolith**. Every boundary is decoupled by clear Service classes, ensuring that if scaling demands it, these components can be extracted into individual Microservices (Docker containers) with minimal refactoring.

```
                  ┌──────────────────────┐
                  │      API Gateway     │
                  │     (Routing/Auth)   │
                  └──────────┬───────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Auth & User    │ │ Booking Service │ │  IoT Ingestion  │
│    Service      │ │                 │ │    Service      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
                   ┌──────────────────┐
                   │    Data Layer    │
                   │   (MongoDB)      │
                   └──────────────────┘
```

---

### 2. Service Separation & Boundaries

#### 2.1 User and Authentication Service (Auth Service)
*   **Domain Responsibility:** Handles registration, credentials validation, password salting/hashing, and session token generation (JWT).
*   **Database Isolation:** Owns the `User` and `Role` schemas.
*   **Interface:**
    *   `registerStudent(payload)`
    *   `login(credentials) -> { token }`
    *   `verifyRole(userId, requiredRole) -> boolean`

#### 2.2 Booking & Reservation Service (Booking Service)
*   **Domain Responsibility:** Manages seat reservations, timeslots collision detection, and student quota validation.
*   **Database Isolation:** Owns the `Booking` schema.
*   **Communications:** Triggers WebSocket events via event emitters when reservations are booked, updated, or cancelled.
*   **Interface:**
    *   `createBooking(userId, seatId, timeRange)`
    *   `cancelBooking(bookingId, userId)`
    *   `checkIn(bookingId, seatId, userId)`
    *   `autoReleaseReservations()` (cron triggered)

#### 2.3 IoT Ingestion and Device Monitor Service (IoT Service)
*   **Domain Responsibility:** Handles MQTT message processing, device heartbeats, signal strength tracking, and offline transitions.
*   **Database Isolation:** Owns the `Device` schema and updates `Seat` occupancy statuses.
*   **Communications:** Receives raw messages from the MQTT broker, writes status flags to the DB, and emits `seat_status_update` and `device_status_update` to the Socket.IO server room layers.
*   **Interface:**
    *   `processMQTTMessage(topic, payload)`
    *   `registerDevice(deviceDetails)`
    *   `runDeviceWatchdog()` (cron triggered)

---

### 3. Decoupling Strategy (Message Bus Pattern)
To ensure components are not tightly bound to direct function calls of other services:
*   We implement an **Internal Event Broker** using Node's standard `EventEmitter` class.
*   *Example Event Flow:* When the `IoT Service` updates a seat to `occupied`, it publishes an internal event: `eventEmitter.emit('seat.occupied', { seatId, timestamp })`.
*   The `Booking Service` listens for this event: `eventEmitter.on('seat.occupied', (data) => { this.handleCheckIn(data.seatId) })`.
*   If we scale to true microservices, we can substitute this `EventEmitter` pattern with an external queue like **RabbitMQ** or **Redis Pub/Sub** with no changes to the core business services.
