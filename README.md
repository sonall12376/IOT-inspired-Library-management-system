# SmartLibrary AI — Real-Time IoT-Inspired Library Seat Management System

SmartLibrary AI is a real-time library seat management platform that integrates hardware sensor telemetry with dynamic web visualization to solve space inefficiencies, eliminate ghost reservations, and automate seat occupancy tracking.

---

## 🛠 Tech Stack & Tools

*Verified from package manifests and source imports:*

* **Backend & API Framework:** Java 17, Spring Boot 3.2.5 (`spring-boot-starter-web`, `spring-boot-starter-data-mongodb`, `spring-boot-starter-security`, `spring-boot-starter-websocket`)
* **Database & Persistence:** MongoDB (via Spring Data MongoDB)
* **Authentication & Security:** Spring Security, JJWT (`io.jsonwebtoken:jjwt-api:0.11.5`)
* **Real-Time Communications:** Eclipse Paho MQTT (`org.eclipse.paho.client.mqttv3:1.2.5`), WebSockets / STOMP (`@stomp/stompjs`, `sockjs-client`)
* **Frontend Web Application:** TypeScript, React 18.2.0, Vite 5.1.4, Tailwind CSS 3.4.1, Framer Motion 11.0.8, Recharts 2.12.2, Lucide React 0.344.0, Axios 1.6.8, Nginx
* **IoT Firmware & Telemetry Simulation:** C++ with Arduino Framework on ESP32 (PlatformIO `espressif32`, `PubSubClient:2.8`, `ArduinoJson:6.21.3`), Node.js (`mqtt` client library for mock telemetry)
* **DevOps & Containerization:** Docker, Docker Compose (`mongo:6.0`, `emqx/emqx:5.3.0`, Spring Boot container, Nginx reverse proxy)

---

## 📊 Dataset Used

* **No ML or static dataset exists in this repository.**
* Telemetry data is generated dynamically in real-time from physical ESP32 HC-SR04 ultrasonic distance sensors or simulated via the Node.js telemetry script (`iot/simulator/mock_sensors.js`).

---

## ⚙️ Approach & System Pipeline

1. **Hardware Telemetry & Ingestion:** ESP32 hardware nodes (or `mock_sensors.js`) measure presence via ultrasonic distance (<80 cm threshold, 5s debounce). Telemetry payloads are published over MQTT to topics (`library/floors/:floor/rooms/:room/seats/:seat/status` and `library/devices/:mac/heartbeat`).
2. **Backend Logic & State Management:** Spring Boot (`MQTTService`) ingests MQTT payloads. Physical seat occupancy automatically triggers booking check-ins. Background services manage reservation lifecycles:
   * **`WatchdogService`:** Monitors hardware heartbeats every 30s and flags devices `OFFLINE` if inactive for >180s.
   * **`BookingSchedulerService`:** Cancels no-show bookings after 15 minutes, handles 10-minute temporary absence grace periods, and auto-completes expired sessions.
3. **Database & Real-Time Sync:** Data is stored in MongoDB collections (`User`, `Floor`, `Seat`, `Device`, `Booking`, `Notification`, `AuditLog`, `RefreshToken`). State changes are pushed via STOMP/WebSockets (`WebSocketRoomHandler`) to client rooms.
4. **Interactive Dashboard:** The React client renders dynamic seat maps, interactive reservation workflows, occupancy analytics (Recharts), and hardware monitoring dashboards.

---

## 📈 Results

* **Results not logged in repo** *(This repository is a full-stack IoT and software application; no machine learning model training or accuracy benchmarks are included).*

---

## 🚀 How to Run

### Prerequisite Dependencies
* Docker & Docker Compose **OR** Java 17, Node.js (v20+), MongoDB (port 27017), and MQTT Broker (port 1883).

### Option 1: Docker Compose (Recommended)
```bash
docker compose up --build -d
```
*Access the web application at `http://localhost`.*

### Option 2: Manual Local Setup

1. **Backend (Spring Boot):**
   ```bash
   cd backend
   mvn clean package
   java -jar target/smartlibrary-1.0.0.jar
   # Backend runs on http://localhost:5000
   ```

2. **Frontend (React + Vite):**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

3. **IoT Telemetry Simulator (Mock Sensors):**
   ```bash
   cd iot/simulator
   npm install mqtt
   node mock_sensors.js mqtt://localhost:1883 5
   ```

---

## 📂 Project Structure

```text
.
├── backend/               # Spring Boot (Java 17) REST API, MQTT Ingestion & WebSocket Server
│   ├── src/main/java/     # Controllers, Models, Repositories, Services, Security
│   └── pom.xml            # Maven dependencies (Spring Boot, MongoDB, Paho MQTT, JJWT)
├── frontend/              # React + TypeScript Vite Web Client
│   ├── src/               # Seat map UI, Analytics components, Auth Context, WebSocket client
│   ├── package.json       # Frontend dependencies (React, Vite, Tailwind CSS, Recharts)
│   └── nginx.conf         # Production Nginx reverse proxy configuration
├── iot/                   # Hardware Node Firmware & Simulator
│   ├── firmware/          # PlatformIO C++ firmware for ESP32 & HC-SR04 Ultrasonic Sensor
│   └── simulator/         # Node.js MQTT mock sensor telemetry script (mock_sensors.js)
├── docs/                  # Architecture, SRS, API specs, database schemas & LLD/HLD docs
└── docker-compose.yml     # Orchestration for MongoDB, EMQX Broker, Backend, and Frontend
```