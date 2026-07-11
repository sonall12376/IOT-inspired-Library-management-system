# Integration Testing Plan
## SmartLibrary AI - IoT Based Smart Library Seat Management System

Integration tests verify that database engines, socket routes, API services, and message queues communicate cleanly without regression.

---

### 1. In-Memory Database Isolation
To prevent tests from polluting or mutating production databases:
*   We use **`mongodb-memory-server`**. During the integration test boot-up script, a virtual MongoDB instance is launched in RAM.
*   *Lifecycle hook:*
```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

---

### 2. API Endpoint Testing (Supertest)
We wrap our Express application instance using `supertest` to test requests over fake HTTP ports.

#### 2.1 Test Flows
1.  **Auth Flow:**
    *   Send `POST /api/auth/register` with test user details.
    *   Verify record is saved in Mongo memory database.
    *   Send `POST /api/auth/login` and verify a JWT is returned.
2.  **Booking Authorization:**
    *   Send `POST /api/bookings` without JWT -> Verify `401 Unauthorized` response.
    *   Send `POST /api/bookings` with Student JWT -> Verify booking is created and returned with ID.
    *   Send `PUT /api/seats/:id/override` with Student JWT -> Verify `403 Forbidden` response.
    *   Send same request with Librarian JWT -> Verify `200 OK` response.

---

### 3. Real-Time Telemetry Pipeline Integration
Validates the complete path from a hardware report to database change and browser message.
*   **Method:**
    1.  Start a local instance of the Express app, Socket.IO server, and the MQTT listener worker.
    2.  Use a mock MQTT client to publish a payload to `library/floors/1/rooms/hallA/seats/S-101/status`:
        ```json
        { "macAddress": "24:0A:C4:8B:58:FC", "occupied": true }
        ```
    3.  Assert that a database lookup on seat `S-101` reports status as `occupied`.
    4.  Verify that a mock Socket.IO client subscribed to room `floor:1` receives the `seat_status_update` event with the correct parameters within 200ms.
