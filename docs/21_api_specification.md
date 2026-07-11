# API Specification (OpenAPI / Swagger)
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document specifies the REST API endpoints available in the SmartLibrary AI backend.

---

### 1. Authentication Endpoints

#### 1.1 User Registration
*   **Endpoint:** `POST /api/auth/register`
*   **Access:** Public
*   **Request Body:**
    ```json
    {
      "name": "Jane Doe",
      "email": "jane.doe@university.edu",
      "password": "SecurePassword123"
    }
    ```
*   **Responses:**
    *   `201 Created`
        ```json
        {
          "success": true,
          "message": "User registered successfully",
          "user": {
            "id": "60d5ec4b8f1b2c001f8e21a1",
            "name": "Jane Doe",
            "email": "jane.doe@university.edu",
            "role": "student"
          }
        }
        ```
    *   `400 Bad Request` (Email already exists or invalid password schema)

#### 1.2 User Login
*   **Endpoint:** `POST /api/auth/login`
*   **Access:** Public
*   **Request Body:**
    ```json
    {
      "email": "jane.doe@university.edu",
      "password": "SecurePassword123"
    }
    ```
*   **Responses:**
    *   `200 OK`
        ```json
        {
          "success": true,
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": {
            "id": "60d5ec4b8f1b2c001f8e21a1",
            "name": "Jane Doe",
            "email": "jane.doe@university.edu",
            "role": "student"
          }
        }
        ```
    *   `401 Unauthorized` (Invalid credentials)

---

### 2. Floors & Layouts Endpoints

#### 2.1 Fetch All Floors
*   **Endpoint:** `GET /api/floors`
*   **Access:** Authenticated (Student, Librarian, Admin)
*   **Responses:**
    *   `200 OK`
        ```json
        [
          {
            "id": "60d5ec4b8f1b2c001f8e21a2",
            "floorNumber": 1,
            "name": "First Floor Main Hall",
            "gridDimensions": { "rows": 10, "columns": 10 }
          }
        ]
        ```

#### 2.2 Create New Floor
*   **Endpoint:** `POST /api/floors`
*   **Access:** Admin Only
*   **Request Body:**
    ```json
    {
      "floorNumber": 2,
      "name": "Second Floor Reading Room",
      "gridDimensions": { "rows": 15, "columns": 15 }
    }
    ```
*   **Responses:**
    *   `201 Created`

---

### 3. Seat Endpoints

#### 3.1 Fetch Seats for a Floor
*   **Endpoint:** `GET /api/floors/:floorId/seats`
*   **Access:** Authenticated
*   **Responses:**
    *   `200 OK`
        ```json
        [
          {
            "id": "60d5ec4b8f1b2c001f8e21a3",
            "seatNumber": "S-101",
            "floorId": "60d5ec4b8f1b2c001f8e21a2",
            "roomName": "Silent Zone",
            "seatType": "desk",
            "hasPowerOutlet": true,
            "isNearWindow": false,
            "coordinates": { "x": 1, "y": 3 },
            "status": "vacant",
            "deviceId": "60d5ec4b8f1b2c001f8e21a4"
          }
        ]
        ```

#### 3.2 Override Seat Status (Force release or set maintenance)
*   **Endpoint:** `PUT /api/seats/:seatId/override`
*   **Access:** Librarian, Admin
*   **Request Body:**
    ```json
    {
      "status": "maintenance",
      "reason": "Faulty charging socket"
    }
    ```
*   **Responses:**
    *   `200 OK` (Updates DB, triggers WebSocket event, writes to audit log)

---

### 4. Booking Endpoints

#### 4.1 Create Reservation
*   **Endpoint:** `POST /api/bookings`
*   **Access:** Student, Librarian, Admin
*   **Request Body:**
    ```json
    {
      "seatId": "60d5ec4b8f1b2c001f8e21a3",
      "startTime": "2026-07-12T09:00:00.000Z",
      "endTime": "2026-07-12T11:00:00.000Z"
    }
    ```
*   **Responses:**
    *   `201 Created`
    *   `400 Bad Request` (Time conflicts, seat already taken, student quota exceeded)

#### 4.2 Cancel Booking
*   **Endpoint:** `PUT /api/bookings/:bookingId/cancel`
*   **Access:** Student (if owner), Librarian, Admin
*   **Responses:**
    *   `200 OK` (Releases seat to vacant, updates booking status to `cancelled`)
