# Technology Stack Justification
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Technology Selection Overview

| Layer | Technology | Selected Choice | Key Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | Framework & Build Tool | React + Vite + TypeScript | Angular, Next.js (SSG/SSR not needed here) |
| **Frontend Styling**| Styling System | Tailwind CSS | CSS Modules, Styled Components |
| **Frontend Motion** | Animation Library | Framer Motion | GSAP, Vanilla CSS Transitions |
| **Backend Core** | Server Engine & Language| Node.js + Express + TypeScript| Python (FastAPI), Go, Java |
| **Real-time Push** | Websocket Transport | Socket.IO | Raw WebSockets, Centrifugo |
| **Message Broker** | MQTT Broker | EMQX / Eclipse Mosquitto | RabbitMQ, Apache Kafka |
| **Database** | Database Engine | MongoDB | PostgreSQL, Redis (alone) |
| **IoT Node** | Microcontroller | ESP32 | ESP8266, Raspberry Pi Pico W |

---

### 2. Justification Details

#### 2.1 Frontend Stack
*   **React + Vite:** React is chosen for its declarative component model, ideal for rendering interactive floor grids. Vite offers near-instantaneous hot module replacement (HMR) and fast build processes, streamlining development compared to Webpack.
*   **TypeScript:** Type safety is critical when handling real-time data shapes. Specifying strict types for WebSockets and MQTT JSON payloads prevents runtime errors in UI rendering.
*   **Tailwind CSS:** Utility-first styling lets us rapidly build custom dashboards. Tailwind's standard classes compile to highly optimized, small-footprint CSS, making load times minimal.
*   **Framer Motion:** Since seats will continuously change color (Green -> Red -> Yellow), Framer Motion allows us to animate status transitions and sidebar disclosures smoothly (e.g. spring transitions), which gives the app a premium, Stripe-like feel.

#### 2.2 Backend Stack
*   **Node.js + Express:** Node's non-blocking, event-driven I/O model is perfect for real-time applications where IO-bound processes (handling MQTT events, Socket.IO clients) dominate. Express provides a simple, un-opinionated router for our JSON API.
*   **Socket.IO:** Offers out-of-the-box automatic reconnection, fallback transports (long polling), and rooms namespace division, which simplifies partitioning socket updates by Library Floor IDs.
*   **MQTT Broker (EMQX / Mosquitto):** MQTT is a lightweight, low-overhead binary protocol. It is specifically designed for constrained devices like the ESP32, consuming minimal power and network bandwidth compared to HTTP REST.

#### 2.3 Database Stack
*   **MongoDB (NoSQL Document Store):**
    *   *Flexible Schema:* Useful for mapping library layout JSON shapes, where some floors have differing layout arrangements, grid dimensions, and custom seat attributes.
    *   *GeoJSON & Compound Querying:* Makes searching for seats in proximity of coordinates extremely fast.
    *   *Mongoose ORM:* Provides strong schema validation, hooks (middleware for pre-save hashing, cascades), and TypeScript integration.

#### 2.4 IoT Edge
*   **ESP32:** Selected over the older ESP8266 due to:
    *   Dual-core processing (can handle sensor reading on one core and MQTT/Wi-Fi tasks on the other).
    *   Built-in Wi-Fi and Bluetooth Low Energy (BLE), allowing local provisioning.
    *   Extensive hardware timers and analog-to-digital converters (ADC) for ultrasonic and infrared sensors.
