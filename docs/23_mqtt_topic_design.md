# MQTT Topic Design
## SmartLibrary AI - IoT Based Smart Library Seat Management System

SmartLibrary AI relies on a clean, scalable topic tree design for physical ESP32 communication. MQTT QoS (Quality of Service) policies and light JSON payloads ensure efficiency.

---

### 1. Topic Structure & Design

```
library/
└── floors/
    └── {floor_number}/
        └── rooms/
            └── {room_slug}/
                └── seats/
                    └── {seat_number}/
                        ├── status      (Uplink: telemetry)
                        ├── heartbeat   (Uplink: hardware diagnostics)
                        └── control     (Downlink: remote configuration)
```

---

### 2. Uplink Topics (Device to Server)

#### 2.1 Seat Status Telemetry
*   **Topic:** `library/floors/{floor_number}/rooms/{room_slug}/seats/{seat_number}/status`
*   **QoS Level:** `QoS 1` (Ensures that state transitions are guaranteed to arrive at the server).
*   **Payload Schema:**
    ```json
    {
      "macAddress": "24:0A:C4:8B:58:FC",
      "occupied": true,
      "sensorDistanceCm": 45, // Reading from ultrasonic sensor
      "timestamp": 1782345600
    }
    ```

#### 2.2 Device Diagnostics (Heartbeat)
*   **Topic:** `library/devices/{mac_address}/heartbeat`
*   **QoS Level:** `QoS 0` (Best effort, minor dropped heartbeats are handled by the 180s grace watchdog).
*   **Payload Schema:**
    ```json
    {
      "status": "online",
      "rssi": -67, // Wi-Fi Signal Strength indicator
      "batteryPercentage": 88, // Omitted if device is plugged into AC power
      "firmwareVersion": "1.0.4",
      "uptimeSeconds": 1420
    }
    ```

---

### 3. Downlink Topics (Server to Device)

#### 3.1 Device Control commands
*   **Topic:** `library/devices/{mac_address}/control`
*   **QoS Level:** `QoS 1` (Guarantees command delivery).
*   **Payload Schema:**
    ```json
    {
      "command": "reboot", // Enum: ['reboot', 'update_reporting_interval', 'trigger_led']
      "params": {
        "intervalSeconds": 30 // Optional modification values
      }
    }
    ```

---

### 4. MQTT Security & Configuration Policies
1.  **Transport Security (TLS):** All MQTT connections must connect over port `8883` using TLS 1.2/1.3. Cleartext port `1883` is closed on production networks.
2.  **Authentication:** Every ESP32 client must authenticate with the broker using a unique username (matching its MAC address) and a unique device token provisioned at setup.
3.  **Authorization (ACLs):**
    *   *ESP32 Nodes:* Can ONLY publish to their specific `status` and `heartbeat` topics and subscribe to their own `control` topic. They are restricted from subscribing to wildcards (`#` or `+`).
    *   *Express Backend:* Has full read/write wildcard permissions (`library/#`).
