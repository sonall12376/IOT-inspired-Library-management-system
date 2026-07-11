# Functional Requirements Document (FRD)
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Introduction
This Functional Requirements Document (FRD) outlines the specific features, workflows, and functional capabilities that must be implemented in the SmartLibrary AI application.

### 2. Functional Modules & Requirements

#### 2.1 Module 1: Authentication & Role-Based Access Control (RBAC)
*   **Requirement FR-1.1:** The system shall support three user roles: Admin, Librarian, and Student.
*   **Requirement FR-1.2:** Users must authenticate using email and password. JSON Web Tokens (JWT) must be returned on successful authentication.
*   **Requirement FR-1.3:** JWTs must have a 24-hour expiration time and be stored securely (HTTP-only cookies on the frontend).
*   **Requirement FR-1.4:** Access to dashboard routes must be strictly restricted based on roles.
    *   *Student:* View floor maps, book seats, check booking history, cancel their reservations.
    *   *Librarian:* All student capabilities plus: release seats, modify seat status to "Maintenance", check device metrics, view general occupancy logs.
    *   *Admin:* All librarian capabilities plus: add/remove floors, add/edit/remove library rooms/seats, add/remove user accounts, update global configurations, inspect system-wide audit logs.

#### 2.2 Module 2: Floor & Library Layout Management
*   **Requirement FR-2.1:** The admin must be able to create, read, update, and delete (CRUD) Library buildings, floors, and rooms.
*   **Requirement FR-2.2:** The system must allow administrators to design floor layouts by assigning seats to coordinate positions (x, y on grid layout).
*   **Requirement FR-2.3:** Seats must store properties such as: `seatNumber`, `seatType` (Individual Desk, Collaborative Desk, PC Terminal), `hasOutlet` (boolean), `isNearWindow` (boolean), and `status` (Vacant, Occupied, Reserved, Maintenance).

#### 2.3 Module 3: Real-Time Seat Status Engine
*   **Requirement FR-3.1:** The backend must connect to the MQTT Broker (`EMQX`/`Mosquitto`) and subscribe to the topic `library/floor/+/room/+/seat/+/status`.
*   **Requirement FR-3.2:** When a payload is received, the backend must update the corresponding seat status in MongoDB and emit the update immediately over Socket.IO to connected web clients.
*   **Requirement FR-3.3:** The frontend must update the visual status color of the seat on the interactive map:
    *   *Vacant:* Green.
    *   *Occupied:* Red.
    *   *Reserved:* Yellow (blinking or highlighted).
    *   *Maintenance / Offline:* Gray.

#### 2.4 Module 4: Seat Reservation & Auto-Release Lifecycle
*   **Requirement FR-4.1:** Students can select a vacant seat and book it for a specific timeslot (maximum 4 hours per reservation, maximum 2 active reservations per day).
*   **Requirement FR-4.2:** Once booked, the seat status changes to **Reserved**.
*   **Requirement FR-4.3 (Grace Period):** A 15-minute countdown starts when the reservation time begins. The student must check in by sitting at the seat.
*   **Requirement FR-4.4:** If the ESP32 occupancy sensor reports occupancy (`state = 1`) at that seat during the grace period, the reservation status changes to "Active" and seat color changes to "Occupied".
*   **Requirement FR-4.5:** If no occupancy is detected within 15 minutes, the system must trigger auto-cancellation, release the seat back to **Vacant**, and send a system notification to the user.
*   **Requirement FR-4.6 (Failsafe release):** If a student leaves their seat (sensor reports `state = 0` during active booking) for more than 10 consecutive minutes (temporary departure like bathroom break), the system sends a push warning. If absence exceeds 20 minutes, the booking is terminated.

#### 2.5 Module 5: Device Management
*   **Requirement FR-5.1:** Every ESP32 hardware node must send a heartbeat MQTT payload every 60 seconds to `library/devices/heartbeat`.
*   **Requirement FR-5.2:** The backend must monitor these heartbeats. If a device fails to report for 3 consecutive intervals (180 seconds), its status must be updated to "Offline", and the associated seat marked "Offline" (Gray) on the map.
*   **Requirement FR-5.3:** Librarians and Admins must have a screen to view list of all devices, their connection status, MAC addresses, RSSI (signal strength), and battery levels.

### 3. Edge Cases & Error Handling
*   **Sensor Noise (Fluttering):** IR sensors can output brief spikes if someone shifts in their seat. The ESP32 firmware or the backend ingestion service must implement a debounce algorithm (e.g., status changes must persist for 5 seconds before publishing/updating).
*   **Double Booking Conflict:** If two users attempt to book the same seat at the exact same millisecond, the database must implement optimistic concurrency locks (or unique index constraints on `seat_id` + `timeslot`) to ensure only one booking succeeds and the other is returned a "Conflict" error response.
