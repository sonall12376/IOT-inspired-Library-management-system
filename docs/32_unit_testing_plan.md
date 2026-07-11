# Unit Testing Plan
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document outlines the unit testing specifications, test cases, and configuration files for the SmartLibrary AI codebase.

---

### 1. Testing Frameworks & Tools
*   **Backend (Node.js):** Jest + `ts-jest` for executing TypeScript tests.
*   **Frontend (React):** Vitest + React Testing Library for fast, DOM-mocked component testing.

---

### 2. Focus Areas & Test Suites

#### 2.1 Booking Collisions & Overlaps (`backend/src/services/bookingService.ts`)
The overlap logic is the most critical calculation. Unit tests must cover all overlap scenarios:

*   **Test Case 1 (No Overlap - Sequential):**
    *   *Existing:* 09:00 - 11:00
    *   *Requested:* 11:00 - 13:00
    *   *Expected Result:* Allowed (True)
*   **Test Case 2 (Overlap - Start Encapsulated):**
    *   *Existing:* 09:00 - 11:00
    *   *Requested:* 08:30 - 09:30
    *   *Expected Result:* Rejected (False)
*   **Test Case 3 (Overlap - End Encapsulated):**
    *   *Existing:* 09:00 - 11:00
    *   *Requested:* 10:30 - 11:30
    *   *Expected Result:* Rejected (False)
*   **Test Case 4 (Overlap - Completely Engulfed):**
    *   *Existing:* 09:00 - 11:00
    *   *Requested:* 09:30 - 10:30
    *   *Expected Result:* Rejected (False)

#### 2.2 Auth Password Validator (`backend/src/utils/validators.ts`)
*   **Test Cases:**
    *   Passwords missing capital letters (Reject)
    *   Passwords shorter than 8 characters (Reject)
    *   Strong alphanumeric strings (Allow)

#### 2.3 Frontend Coordinate Mapper (`frontend/src/utils/coords.ts`)
*   **Test Cases:**
    *   Translating relative coordinates `(x: 5, y: 5)` into canvas pixels on a dynamic container grid.
    *   Handling viewport resizing scale ratios.

---

### 3. Mocking Strategy
To run tests without requiring database connections or active MQTT brokers:
*   **Mongoose Models:** Mock standard methods (`find`, `findOne`, `create`, `findOneAndUpdate`) using Jest's `jest.mock('../../models/Seat')`.
*   **MQTT client:** Create mock listener interfaces that mimic incoming messages manually:
```typescript
const mockMqttClient = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  on: jest.fn()
};
```
