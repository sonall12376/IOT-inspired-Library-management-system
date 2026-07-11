# Database Design
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Data Modeling Strategy: Document vs. Relational
SmartLibrary AI uses **MongoDB**, a document-oriented database. While library spaces have structured relationships (e.g. Building -> Floor -> Room -> Seat), a document structure allows us to:
*   Store floor layouts as single coordinate grids without doing multiple SQL joins.
*   Update seat occupancy states with atomic operations.
*   Store device telemetry historical records as time-series data or document sub-arrays.

To maintain reference integrity, we use Mongoose validation schemas with references (`type: Schema.Types.ObjectId`).

---

### 2. Normalization vs. Denormalization Decisions
1.  **Users & Bookings (Normalized):** Keep `User` and `Booking` documents separate. This prevents single user documents from growing infinitely as they make bookings over time.
2.  **Seats and Floor Grid (Hybrid):** 
    *   `Floors` are distinct documents that hold metadata (floor number, SVG map asset reference).
    *   `Seats` reference their corresponding `Floor` and `Room` IDs.
    *   Coordinate objects `{ x, y }` are embedded directly in the `Seat` document as sub-objects to guarantee fast single-query renders of interactive map grids.

---

### 3. Indexing Strategy
To meet the performance requirements (<50ms query times), we will construct the following indexes:

#### 3.1 Bookings Indexes
*   **Compound Query Index:** `{ seatId: 1, startTime: 1, endTime: 1 }`
    *   *Purpose:* Rapidly verifies seat availability during overlapping timeslots check.
*   **User Check Index:** `{ studentId: 1, status: 1 }`
    *   *Purpose:* Fetch active reservations for a student to check quotas.
*   **Time-to-Live (TTL) Index:** `{ createdAt: 1 }` with an expiry window on a dedicated `TempToken` or `Notifications` collection to purge expired records automatically.

#### 3.2 Seats Indexes
*   **Compound Grid Lookup:** `{ floorId: 1, status: 1 }`
    *   *Purpose:* Renders all seats for a given floor and highlights vacancies.
*   **Device Link Index:** `{ deviceId: 1 }`
    *   *Purpose:* Allows the MQTT listener service to look up a seat by device ID within <5ms upon receiving a sensor report.

#### 3.3 Devices Indexes
*   **Unique Index:** `{ macAddress: 1 }`
    *   *Purpose:* Direct hardware lookup during device telemetry ingestion.

---

### 4. Transactions and Locks
Mongoose multi-document transactions will be implemented for booking creation. When a user requests a booking, a transaction is opened:
1.  Query seat status. Verify it is `vacant` for that slot.
2.  Create booking record.
3.  Modify seat state to `reserved` (if booking starts immediately).
4.  If any step fails, the session is aborted, restoring previous seat states.
