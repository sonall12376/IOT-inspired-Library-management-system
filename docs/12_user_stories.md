# User Stories
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Student User Stories

#### Story ST-1: Live Seating Status View
*   **Description:** As a Student, I want to see a live visual floor map of the library with color-coded seats, so that I can immediately identify vacant seats without wandering around.
*   **Acceptance Criteria:**
    *   *Given* I am logged into the Student Dashboard.
    *   *When* I select a floor from the dropdown.
    *   *Then* the interactive SVG floor plan is rendered.
    *   *And* vacant seats are highlighted in Green, occupied seats in Red, reserved seats in Yellow, and offline seats in Gray.
    *   *And* seat statuses must update automatically in real-time (<1 second) when a physical sensor detects state change.
*   **Priority:** High.

#### Story ST-2: Reserve a Seat
*   **Description:** As a Student, I want to reserve an empty seat online for a specific timeslot, so that I am guaranteed a study space when I arrive.
*   **Acceptance Criteria:**
    *   *Given* I am viewing the visual floor map.
    *   *When* I click on a Green (Vacant) seat.
    *   *Then* a booking sidebar pops up displaying seat details (outlets, window views) and timeslot selectors.
    *   *When* I confirm a valid booking (within daily quota limits, no overlaps).
    *   *Then* the seat turns Yellow (Reserved) on all dashboards.
    *   *And* the system schedules a 15-minute grace check-in window.
*   **Priority:** High.

#### Story ST-3: Check-in / Presence Detection
*   **Description:** As a Student, I want my physical presence at the reserved seat to automatically check me in, so that I do not have to perform manual scan actions.
*   **Acceptance Criteria:**
    *   *Given* I have an active reservation starting now.
    *   *When* I physically sit on the reserved seat before the 15-minute grace period expires.
    *   *Then* the ESP32 occupancy sensor reports active status.
    *   *And* the system updates my booking status to "Active".
    *   *And* the seat color transitions to Red (Occupied) for all users.
*   **Priority:** High.

---

### 2. Librarian User Stories

#### Story LI-1: Seat Status Override
*   **Description:** As a Librarian, I want to manually release a reserved or occupied seat, so that I can handle disputes or seat-hogging situations where a student leaves belongings but is absent.
*   **Acceptance Criteria:**
    *   *Given* I am logged into the Librarian Dashboard.
    *   *When* I click on an occupied/reserved seat on the map and click "Release Seat".
    *   *Then* the system prompt requests an override reason.
    *   *When* I submit the reason, the booking is terminated immediately.
    *   *And* the seat status resets to Vacant.
    *   *And* an entry is written to the audit log.
*   **Priority:** Medium.

#### Story LI-2: Device Diagnostic Panel
*   **Description:** As a Librarian, I want to see a live status list of all ESP32 sensor devices, so that I can quickly dispatch technicians to fix offline units.
*   **Acceptance Criteria:**
    *   *Given* I navigate to the Device Management screen.
    *   *Then* I see a paginated list of all devices with MAC address, assigned seat number, Wi-Fi signal strength (RSSI), battery level, and last heartbeat timestamp.
    *   *And* any device that has not sent a heartbeat for over 180 seconds is flagged as "Offline" with a red indicator.
*   **Priority:** Medium.

---

### 3. Administrator User Stories

#### Story AD-1: Dynamic Floor Layout Creator
*   **Description:** As an Admin, I want to add, edit, or delete seats on a virtual coordinate grid, so that I can match the layout to physical library renovations.
*   **Acceptance Criteria:**
    *   *Given* I am in the Floor Designer screen.
    *   *When* I select a floor grid, double-click on any x/y coordinate, and input a seat number.
    *   *Then* a new seat node is created with coordinates successfully persisted to the database.
    *   *And* I can assign a MAC address of an ESP32 sensor to this seat.
*   **Priority:** High.
