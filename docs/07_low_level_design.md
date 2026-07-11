# Low-Level Design (LLD)
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Class & Interface Structures (TypeScript)

#### 1.1 Seat Model Interface
```typescript
interface ISeat {
  _id: string;
  seatNumber: string;
  roomId: string;
  floorId: string;
  seatType: 'desk' | 'pc' | 'lounge';
  hasPowerOutlet: boolean;
  isNearWindow: boolean;
  coordinates: { x: number; y: number };
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance' | 'offline';
  deviceId?: string;
  lastHeartbeat?: Date;
  updatedAt: Date;
}
```

#### 1.2 Booking Model Interface
```typescript
interface IBooking {
  _id: string;
  studentId: string;
  seatId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'no-show';
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
}
```

#### 1.3 Device Model Interface
```typescript
interface IDevice {
  _id: string;
  macAddress: string;
  deviceName: string;
  seatId?: string;
  status: 'online' | 'offline' | 'maintenance';
  rssi: number;
  batteryPercentage?: number;
  firmwareVersion: string;
  lastHeartbeat: Date;
}
```

### 2. Core Algorithmic Workflows

#### 2.1 Seat Occupancy Ingestion Algorithm (MQTT to WebSockets)
```
[MQTT Message Received]
          │
          ▼
[Parse JSON payload]
          │
          ├───► Fail: [Log Warning & Discard]
          ▼
[Lookup Seat by deviceId or topic path]
          │
          ├───► Not Found: [Log Warning & Discard]
          ▼
[Compare New State with DB State]
          │
          ├───► Identical: [Discard, no action needed]
          ▼
[Update DB status, lastHeartbeat & update device RSSI]
          │
          ▼
[Emit Socket.IO Event 'seat_status_update' to rooms]
          │
          ▼
[Trigger Audit Log if state transition is critical]
```

#### 2.2 Reservation & Grace Period Scheduler
The system schedules check-in deadlines using a distributed task scheduler (e.g., Agenda or simple Redis TTL, but standard Node-cron / Agenda is used here for database-backed persistence).
1.  **On Booking Creation:**
    *   Create `Booking` in state `pending`.
    *   Schedule task `checkReservationAttendance` at `booking.startTime + 15 minutes`.
2.  **During Grace Period:**
    *   If sensor reports `occupied: true` -> set booking status to `active` and update `checkInTime`. Cancel the scheduled task.
3.  **On Task Execution (15m elapsed):**
    *   Fetch `Booking` state.
    *   If status is still `pending` (no check-in occurred) -> update booking status to `no-show`.
    *   Release the associated seat status to `vacant`.
    *   Emit Socket.IO update.
    *   Send email/push notification to student.

### 3. Device Watchdog Daemon (Heartbeat Monitoring)
*   **Cron Pattern:** Run every 60 seconds.
*   **Query:** Look up all devices where `status == 'online'` and `lastHeartbeat < CurrentTime - 180 seconds`.
*   **Action:** For each matching device:
    1.  Update device status to `offline`.
    2.  If the device is assigned to a seat, update that seat status to `offline` and broadcast WebSocket update `seat_status_update`.
    3.  Create system warning notification for Librarians: *"Device [MAC] went offline. Seat [Number] marked offline."*

### 4. Concurrency & Collision Management
To prevent two students booking the same seat for overlapping slots:
*   Use MongoDB **compound unique indexes** on `seatId` and `status` if booking is instantaneous, OR perform an **atomic find-and-update** operation:
```typescript
const overlappingBooking = await Booking.findOne({
  seatId: requestedSeatId,
  status: { $in: ['pending', 'active'] },
  $or: [
    { startTime: { $lt: requestedEndTime, $gte: requestedStartTime } },
    { endTime: { $gt: requestedStartTime, $lte: requestedEndTime } }
  ]
});
if (overlappingBooking) {
  throw new Error("Seat is already reserved during this time range.");
}
```
*   Use MongoDB Mongoose transaction sessions (`session.startTransaction()`) if executing across multiple collections (e.g., decrementing user quota while creating booking).
