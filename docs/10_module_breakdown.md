# Module Breakdown
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document outlines the architectural division of the project into cohesive, independent directories and modules, ensuring single responsibility principles are maintained across the codebase.

---

### 1. Repository Directory Structure

```
smartlibrary-ai/
├── backend/                   # Node.js + Express backend service
│   ├── src/
│   │   ├── config/            # Database, MQTT, and Logger configurations
│   │   ├── controllers/       # HTTP Request controller handlers
│   │   ├── middlewares/       # JWT verification, RBAC, error handlers
│   │   ├── models/            # MongoDB Schemas (Mongoose)
│   │   ├── routes/            # REST endpoint definitions
│   │   ├── services/          # Pure business logic (Booking calculations, device health)
│   │   ├── socket/            # Socket.IO event handlers and rooms mapping
│   │   ├── worker/            # MQTT listener client and cron jobs
│   │   └── app.ts             # Server entry point
│   ├── tests/                 # Unit and Integration test files
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                  # React + Vite client dashboard
│   ├── src/
│   │   ├── assets/            # Fonts, images, brand files
│   │   ├── components/        # Reusable UI library (Glassmorphism card, skeletons)
│   │   ├── context/           # Global Auth and Socket contexts
│   │   ├── hooks/             # Custom React hooks (useSocket, useAuth)
│   │   ├── layouts/           # Screen structures (AdminLayout, StudentLayout)
│   │   ├── pages/             # Page components (Dashboard, Analytics, SeatMap)
│   │   ├── services/          # Axios HTTP clients & API routes
│   │   ├── utils/             # Helper formatters (date, coordinators mapping)
│   │   ├── App.tsx            # Main layout router
│   │   └── main.tsx           # Dom renderer entry point
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── iot/                       # ESP32 firmware source and simulations
│   ├── firmware/              # C++/Arduino files for ESP32 boards
│   │   ├── src/
│   │   │   ├── main.cpp
│   │   │   ├── mqtt_client.h
│   │   │   └── sensors.h
│   │   └── platformio.ini     # Build config
│   └── simulator/             # Node.js mock MQTT clients to simulate hundreds of seats
│       └── mock_sensors.js
│
└── docs/                      # Technical specification sheets and system diagrams
```

---

### 2. Module Details

#### 2.1 Backend Modules
1.  **Auth Module:** Handles registration, login, token signatures, refresh tokens, and password hashing.
2.  **Seat & Floor Module:** Manages the coordinates grid, adding floor maps, fetching real-time occupancy.
3.  **Booking Service:** Coordinates reservation allocations, validations, checks user quota boundaries, and runs check-in validations.
4.  **MQTT Ingestion Worker:** Standalone worker thread or internal service handling connection to EMQX broker, JSON unpacking, database updates, and dispatching events to Socket.IO handlers.
5.  **Device Watchdog:** Periodically polls database last-heartbeats, marks stale boards as Offline, and pushes warning messages to operators.
6.  **Audit Logs Tracker:** Automatically records state-altering API calls (such as seat overrides, floor deletion) for regulatory safety.

#### 2.2 Frontend Modules
1.  **Auth Feature:** Contains Login Page, Register Page, and Profile preferences.
2.  **Interactive Map Engine:** Core component utilizing vector canvas/SVGs to display seat locations, tooltips with amenity details (outlets, windows), and seat booking buttons.
3.  **Reservation Panel:** Interface displaying current bookings, check-in barcodes (for physical scanners), countdown timers, and booking schedules.
4.  **Dashboard Modules:**
    *   *Student View:* Personal bookings, quick vacancy locator, and check-in confirmation.
    *   *Librarian View:* Active seat release override triggers, maintenance status toggles, and device warning notifications.
    *   *Admin View:* User control lists, floor/seat visual designers, device details, and configuration managers.
5.  **Analytics Dashboard:** Integrates chart packages (Recharts) showing seat occupancy hourly curves, popular floors, and average seat occupation durations.
