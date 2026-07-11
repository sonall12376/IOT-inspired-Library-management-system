# Deployment Diagram
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Physical / Deployment Layout
The SmartLibrary AI system is packaged as a multi-container Docker compose unit. This enables seamless, isolated staging on local servers or hosting on virtual private instances (e.g. AWS EC2, DigitalOcean Droplet).

```mermaid
deploymentNode
graph TD
    subgraph "Campus Wi-Fi Network"
        subgraph "Library Floor Level"
            esp32["ESP32 Microcontrollers (Ultrasonic / IR Sensors)"]
        end
    end

    subgraph "Public Internet"
        user_browser["User Desktop / Mobile Browser"]
    end

    subgraph "On-Premise Server or Cloud VPS (Ubuntu Docker Host)"
        subgraph "Docker Bridge Network"
            nginx["Nginx Container (Reverse Proxy)"]
            express_app["Node.js / Express API Container"]
            mqtt_broker["EMQX / Mosquitto MQTT Container"]
            mongodb[("MongoDB Container (Data Store)")]
        end
    end

    %% Network links & protocol annotations
    user_browser -- "HTTPS / WSS (Port 443)" --> nginx
    esp32 -- "MQTT over TCP (Port 1883 / 8883)" --> mqtt_broker
    
    nginx -- "HTTP Proxy Pass (Port 5000)" --> express_app
    express_app -- "Mongo Wire Protocol (Port 27017)" --> mongodb
    express_app -- "MQTT Socket Sub (Port 1883)" --> mqtt_broker
```

---

### 2. Deployment Nodes Details

#### 2.1 Edge Sensor Nodes (ESP32)
*   **Operating System:** FreeRTOS (embedded in ESP-IDF or Arduino Core).
*   **Environment:** Runs directly on physical hardware attached to library desks.
*   **Connectivity:** Connects to campus access points using WPA/WPA2 Wi-Fi authentication.

#### 2.2 Reverse Proxy Server Container (Nginx)
*   **Role:** Single entry point for all web client interactions.
*   **Tasks:** Handles SSL termination (using certificates supplied by Let's Encrypt), serves static frontend assets directly, and proxies dynamic API/WebSocket connections to the backend container.

#### 2.3 Application Server Container (Express App)
*   **Runtime:** Node.js v20 (Alpine Linux base image).
*   **Tasks:** Runs both the HTTP API engine and the background MQTT ingestion listener.

#### 2.4 Broker Container (EMQX / Eclipse Mosquitto)
*   **Role:** High-throughput message queuing.
*   **Configuration:** Configured with authentication plug-ins to reject telemetry reports from unregistered client nodes.

#### 2.5 Database Container (MongoDB)
*   **Volume Mounts:** Mounts persistent storage path `data/db` to host volume for preventing data loss during container restarts.
*   **Firewall Settings:** Port `27017` is bound strictly to localhost/internal Docker interface, denying external internet access.
