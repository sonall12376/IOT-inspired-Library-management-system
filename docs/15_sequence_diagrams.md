# Sequence Diagrams
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Sequence Diagram: Seat Reservation Request
This diagram details the flow when a student makes a reservation from the React frontend.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Frontend as React Client
    participant API as Express API Server
    participant DB as MongoDB
    participant WS as Socket.IO Server

    Student->>Frontend: Select Seat & click "Book Now"
    Frontend->>API: POST /api/bookings { seatId, startTime, endTime }
    Note over API: Verifies JWT token & permissions
    API->>DB: Query existing active bookings for seat & student
    DB-->>API: Return overlapping bookings (if any)
    
    alt Overlap / Quota Exceeded
        API-->>Frontend: HTTP 400 Bad Request (Error details)
        Frontend-->>Student: Show Toast error notification
    else Seat Available
        API->>DB: Create Booking Document (status: 'pending')
        API->>DB: Update Seat Document (status: 'reserved')
        DB-->>API: Acknowledge updates
        API->>WS: Broadcast 'seat_status_update' { seatId, status: 'reserved' }
        WS-->>Frontend: Emit event (via WebSocket room)
        API-->>Frontend: HTTP 201 Created (Booking details)
        Frontend-->>Student: Show success UI & reservation checklist
        Note over API: Start 15-minute attendance watchdog check
    end
```

---

### 2. Sequence Diagram: IoT Telemetry Occupancy Update
This diagram details the sequence where the physical sensor detects presence and triggers a UI update.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Sensor as ESP32 Occupancy Node
    participant Broker as MQTT Broker (EMQX)
    participant Worker as MQTT Listener (Backend)
    participant DB as MongoDB
    participant WS as Socket.IO Server
    participant Client as React Dashboard

    Student->>Sensor: Sits down (presence detected)
    Note over Sensor: Debounce occupancy check (5 seconds)
    Sensor->>Broker: Publish JSON payload to 'library/floor1/roomA/seat4/status'
    Broker->>Worker: Route message payload
    
    Note over Worker: Decodes and validates payload schema
    Worker->>DB: Update Seat (status: 'occupied')
    
    opt Booking Active/Pending
        Worker->>DB: Find active booking for seat4 -> Update booking (status: 'active', checkInTime: now)
    end
    
    DB-->>Worker: Acknowledge updates
    Worker->>WS: Trigger WebSocket Broadcast event
    WS-->>Client: WebSocket Emit 'seat_status_update' { seatId: 'seat4', status: 'occupied' }
    Note over Client: React hooks capture event & re-render specific Seat component
    Client-->>Client: Color changes dynamically (Yellow -> Red)
```
