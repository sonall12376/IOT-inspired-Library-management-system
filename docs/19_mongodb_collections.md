# MongoDB Collections Schema
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document specifies the exact JSON schemas for each MongoDB collection, including types, constraints, default values, indices, and sample documents.

---

### 1. `users` Collection
Stores details of all authenticated users.

```json
{
  "_id": "ObjectId",
  "name": "String (Required)",
  "email": "String (Required, Unique, Lowercase, Email format)",
  "password": "String (Required, Hashed)",
  "role": "String (Required, Enum: ['student', 'librarian', 'admin'], Default: 'student')",
  "dailyBookingCount": "Number (Default: 0)",
  "createdAt": "Date (Default: now)",
  "updatedAt": "Date (Default: now)"
}
```
*   **Indexes:**
    *   `email: 1` (Unique)

---

### 2. `floors` Collection
Stores floor levels and physical layouts bounds.

```json
{
  "_id": "ObjectId",
  "floorNumber": "Number (Required, Unique)",
  "name": "String (Required, e.g. 'First Floor Main Study Area')",
  "gridDimensions": {
    "rows": "Number (Required)",
    "columns": "Number (Required)"
  },
  "svgLayoutPath": "String (Optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

### 3. `seats` Collection
Stores individual library seats, coordinate placements on the floor map, and ties to devices.

```json
{
  "_id": "ObjectId",
  "seatNumber": "String (Required, e.g., 'S-104')",
  "floorId": "ObjectId (Required, Ref: floors)",
  "roomName": "String (Required, e.g., 'Silent Study Hall')",
  "seatType": "String (Required, Enum: ['desk', 'pc', 'collaborative'], Default: 'desk')",
  "hasPowerOutlet": "Boolean (Default: false)",
  "isNearWindow": "Boolean (Default: false)",
  "coordinates": {
    "x": "Number (Required)",
    "y": "Number (Required)"
  },
  "status": "String (Required, Enum: ['vacant', 'occupied', 'reserved', 'maintenance', 'offline'], Default: 'vacant')",
  "deviceId": "ObjectId (Optional, Ref: devices)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*   **Indexes:**
    *   `floorId: 1, status: 1` (Map query performance)
    *   `deviceId: 1` (Sparse, IoT callback performance)
    *   `seatNumber: 1, floorId: 1` (Unique compound index)

---

### 4. `bookings` Collection
Logs seat reservations.

```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId (Required, Ref: users)",
  "seatId": "ObjectId (Required, Ref: seats)",
  "startTime": "Date (Required)",
  "endTime": "Date (Required)",
  "status": "String (Required, Enum: ['pending', 'active', 'completed', 'cancelled', 'no-show'], Default: 'pending')",
  "checkInTime": "Date (Optional)",
  "checkOutTime": "Date (Optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*   **Indexes:**
    *   `seatId: 1, startTime: 1, endTime: 1` (Reservation conflict index)
    *   `studentId: 1, status: 1` (Quota lookup index)

---

### 5. `devices` Collection
Logs IoT sensors reporting occupancy telemetry.

```json
{
  "_id": "ObjectId",
  "macAddress": "String (Required, Unique, e.g., '24:0A:C4:8B:58:FC')",
  "deviceName": "String (Required)",
  "status": "String (Required, Enum: ['online', 'offline', 'maintenance'], Default: 'offline')",
  "rssi": "Number (Default: 0)",
  "batteryPercentage": "Number (Optional, range: 0-100)",
  "firmwareVersion": "String (Default: '1.0.0')",
  "lastHeartbeat": "Date (Default: now)"
}
```
*   **Indexes:**
    *   `macAddress: 1` (Unique)

---

### 6. `audit_logs` Collection
Tracks modifications performed by admins and librarians.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (Required, Ref: users)",
  "action": "String (Required, e.g. 'SEAT_OVERRIDE', 'DEVICE_OFFLINE')",
  "details": "String (Required)",
  "ipAddress": "String",
  "timestamp": "Date (Default: now)"
}
```
*   **Indexes:**
    *   `timestamp: -1`
    *   `userId: 1`
