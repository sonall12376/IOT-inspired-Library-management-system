# Software Requirements Specification (SRS)
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Introduction
This Software Requirements Specification (SRS) details the functional and non-functional specifications of the SmartLibrary AI platform.

### 2. Overall Description

#### 2.1 Product Perspective
SmartLibrary AI is a three-tier system:
1.  **Hardware Layer (IoT):** ESP32 microcontrollers connected to IR/Ultrasonic sensors reporting data to an MQTT broker.
2.  **Server Layer (Backend):** Node.js/Express APIs, Mongoose/MongoDB database, MQTT listener service, and Socket.IO server.
3.  **Client Layer (Frontend):** React + Vite dashboard displaying floor plans, reservation widgets, and reports.

```
+---------------+     MQTT     +---------------+   WebSockets   +------------------+
| ESP32 Sensors |----------->|  Node.js API  |<------------->| React Dashboard  |
+---------------+            |  & MQTT/WS    |               +------------------+
                             +---------------+
                                     |
                                     v
                             +---------------+
                             |  MongoDB DB   |
                             +---------------+
```

#### 2.2 Product Functions
*   Physical occupancy sensing and reporting.
*   Real-time floor map synchronization.
*   Advance booking and instant reservations.
*   Auto-release of abandoned seats (15-minute grace period).
*   Role-based dashboard views.
*   System health alerts and reports.

#### 2.3 User Classes and Characteristics
*   **Students:** Can view maps, book seats, check-in via web application, and see their history.
*   **Librarians:** Can manage floor layouts, view real-time maps, release seats, and troubleshoot device statuses.
*   **System Administrators:** Full system control, including managing users, configuring MQTT details, checking audit logs, and running database backups.

### 3. External Interface Requirements

#### 3.1 User Interfaces
*   Responsive React-based web app.
*   Supports Desktop (Librarians/Admins) and Mobile/Tablet (Students/Librarians on the go).
*   Interactive visual floor layout with SVG/Canvas-based seat map rendering.

#### 3.2 Hardware Interfaces
*   **ESP32 Microcontrollers:** Committing MQTT publish messages payload containing:
    *   `device_id` (MAC address/uuid)
    *   `seat_id`
    *   `distance` (for ultrasonic) or `state` (0/1 for IR sensor)
    *   `battery_percentage` (if battery powered) or power state.
    *   `timestamp`

#### 3.3 Software Interfaces
*   **Database:** MongoDB version 6.0+ for persistent storage of users, seats, logs, and analytics.
*   **MQTT Broker:** Eclipse Mosquitto or EMQX for message queuing.
*   **Socket.IO:** Real-time event transport framework.

#### 3.4 Communications Interfaces
*   **HTTP/HTTPS:** RESTful API communication for all CRUD operations, user login, and profile management.
*   **MQTT over TCP/WebSockets:** Sensors communicate with broker over MQTT port 1883 or encrypted 8883.
*   **WebSocket (WS/WSS):** Secure real-time seat status updates to clients on port 5000 (Socket.IO).

### 4. System Features

#### 4.1 Real-Time Seating Map
*   **Description:** Displays seating status on an interactive SVG grid.
*   **Priority:** High.
*   **Stimulus/Response Sequence:**
    1.  Sensor detects change in state (occupied -> vacant).
    2.  ESP32 publishes JSON payload to `seat/status` topic.
    3.  Backend MQTT service parses the payload, updates MongoDB, and emits a `seat_update` Socket.IO event.
    4.  Frontend receives event and re-renders the specific seat node.

#### 4.2 Seat Reservation & Grace Period
*   **Description:** Students can book a seat. If they do not sit down within 15 minutes of their booking starting, the system auto-cancels.
*   **Priority:** High.
*   **Stimulus/Response Sequence:**
    1.  Student selects seat and books a slot.
    2.  Backend reserves the seat and schedules a cron job / timeout for 15 minutes.
    3.  If sensor detects presence before 15 minutes, state changes to "Occupied" and the timer cancels.
    4.  If no presence is detected, timer expires, booking is updated to "Cancelled - No Show", and seat returns to "Vacant".
