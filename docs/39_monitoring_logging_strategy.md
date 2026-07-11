# Monitoring & Logging Strategy
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document describes the strategy for system monitoring, error reporting, metrics gathering, and structured logging configs.

---

### 1. Application Logging Specification (Winston Config)
All components of the Node.js backend use **Winston** for logging. We use structured JSON format in production.

#### 1.1 Winston Log Levels
We use standard log levels to filter out noisy messages:
*   `error`: Actionable failures (DB down, email sender crash, invalid key setups).
*   `warn`: Non-critical warnings (stale sensor heartbeat, invalid reservation attempt).
*   `info`: Standard application operations (booking confirmed, device connected, user registered).
*   `debug`: Detailed developer trace outputs (MQTT frame received, JWT verification details).

#### 1.2 Multi-Transport Output Config
*   **Console Transport:** Prints JSON to `stdout` to be consumed by container orchestrators (e.g. Docker logs, PM2, or Datadog agent).
*   **File Transport (with rotation):** Writes logs to dedicated files inside `/var/log/smartlibrary/`.
    *   `combined.log`: All events level `info` and above.
    *   `errors.log`: Strictly `error` level events.
    *   *Retention limit:* Max file size `10MB`, max file retention index `5 files` (uses `winston-daily-rotate-file`).

---

### 2. Metrics & Operational Dashboards (Prometheus & Grafana)

To check system availability and track real-time capacity, we collect the following metrics:

#### 2.1 Ingestion & Server Metrics
*   `http_requests_total`: Counter tracking total REST API calls partitioned by route and response code (e.g. `200`, `500`).
*   `websocket_active_connections`: Gauge tracking total active browser connections.
*   `mqtt_telemetry_rate_per_sec`: Rate counter checking throughput of incoming sensor updates.

#### 2.2 Domain Business Metrics
*   `library_seat_occupancy_ratio`: Percentage gauge tracking how many seats are occupied on each floor level in real-time.
*   `booking_noshow_rate`: Metric comparing total reservations vs. cancelled check-ins to flag users abusing booking rules.

#### 2.3 Hardware Diagnostics Metrics
*   `iot_node_uptime_seconds`: Reports the uptime of individual ESP32 microcontrollers.
*   `iot_node_rssi_dbm`: Tracks Wi-Fi signal strength of nodes to locate dead zones or signal drop issues.
*   `iot_node_battery_level`: Highlights devices requiring battery swaps.
