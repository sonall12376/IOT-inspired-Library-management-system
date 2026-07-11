# WebSocket Event Specification
## SmartLibrary AI - IoT Based Smart Library Seat Management System

SmartLibrary AI leverages WebSockets (via Socket.IO) to push seat states and diagnostic messages to connected dashboards instantly. 

---

### 1. Connection & Room Partitioning
To prevent clients from receiving unnecessary updates for floors they are not viewing, connections are grouped into logical **Rooms**:
*   `floor:<floorId>`: Subscribes clients to occupancy shifts for seats belonging to a specific floor.
*   `diagnostics`: Subscribes librarians and admins to live device heartbeats, RSSI readings, and connection state alterations.
*   `user:<userId>`: Subscribes a specific student's device to receive personal reservation reminders and cancellation warnings.

---

### 2. Events Emitted by Client (Sent to Server)

#### 2.1 Join Floor Room
*   **Event:** `join_floor`
*   **Purpose:** Subscribes user to real-time events for a specific floor map.
*   **Payload:**
    ```json
    {
      "floorId": "60d5ec4b8f1b2c001f8e21a2"
    }
    ```

#### 2.2 Leave Floor Room
*   **Event:** `leave_floor`
*   **Purpose:** Unsubscribes client to reduce network footprint when changing pages or closing map.
*   **Payload:**
    ```json
    {
      "floorId": "60d5ec4b8f1b2c001f8e21a2"
    }
    ```

#### 2.3 Join Diagnostics Channel
*   **Event:** `join_diagnostics`
*   **Purpose:** Subscribes to device monitoring messages. Restricted to Librarian and Admin JWT users.

---

### 3. Events Emitted by Server (Sent to Client)

#### 3.1 Seat Status Update
*   **Event:** `seat_status_update`
*   **Room:** `floor:<floorId>`
*   **Payload:**
    ```json
    {
      "seatId": "60d5ec4b8f1b2c001f8e21a3",
      "floorId": "60d5ec4b8f1b2c001f8e21a2",
      "status": "occupied", // ['vacant', 'occupied', 'reserved', 'maintenance', 'offline']
      "timestamp": "2026-07-11T14:40:00.000Z"
    }
    ```

#### 3.2 Device Status Update
*   **Event:** `device_status_update`
*   **Room:** `diagnostics`
*   **Payload:**
    ```json
    {
      "deviceId": "60d5ec4b8f1b2c001f8e21a4",
      "macAddress": "24:0A:C4:8B:58:FC",
      "status": "offline", // ['online', 'offline', 'maintenance']
      "rssi": -85,
      "batteryPercentage": 15,
      "lastHeartbeat": "2026-07-11T14:38:00.000Z"
    }
    ```

#### 3.3 Personal Booking Alert
*   **Event:** `booking_alert`
*   **Room:** `user:<userId>`
*   **Payload:**
    ```json
    {
      "bookingId": "60d5ec4b8f1b2c001f8e21a9",
      "type": "GRACE_PERIOD_WARNING", // ['GRACE_PERIOD_WARNING', 'AUTO_RELEASED', 'ABSENCE_WARNING']
      "message": "You have 5 minutes left to check in to seat S-101 before your booking is released.",
      "timeoutMs": 300000
    }
    ```
