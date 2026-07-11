# Component Diagram
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Component Diagram

The following diagram details the logical components making up the SmartLibrary AI system and how they interface with each other.

```mermaid
graph TD
    subgraph "Frontend Components (React SPA)"
        subgraph "UI Layer"
            ui_components["Reusable UI Components (Button, Card, Skeletons, InteractiveGrid)"]
            page_dashboards["Dashboard Pages (Student, Librarian, Admin, Analytics)"]
        end
        
        subgraph "Core Client Engine"
            auth_context["Auth Context / State"]
            socket_context["Socket.IO Context / Connection"]
            api_client["API Service Client (Axios wrapper)"]
        end
    end

    subgraph "Backend Components (Node.js/Express Monolith)"
        subgraph "API Gateway Layer"
            routes_auth["Auth Router"]
            routes_bookings["Booking Router"]
            routes_floors["Floor Router"]
            routes_devices["Device Router"]
            middleware_auth["Auth & RBAC Middleware"]
        end

        subgraph "Business Services Layer"
            service_auth["Auth Service"]
            service_booking["Booking Service"]
            service_layout["Layout Service"]
            service_device["Device Watchdog Service"]
        end

        subgraph "Ingestion Worker Layer"
            mqtt_listener["MQTT Subscription Client"]
        end

        subgraph "Data Storage Layer"
            mongoose_models["Mongoose Schemas (User, Seat, Booking, Device, AuditLog)"]
        end
    end

    %% Client-Server Interconnections
    api_client -- "REST HTTP Calls" --> routes_auth
    api_client -- "REST HTTP Calls" --> routes_bookings
    api_client -- "REST HTTP Calls" --> routes_floors
    api_client -- "REST HTTP Calls" --> routes_devices
    
    socket_context -- "WSS Socket.IO Stream" --> routes_bookings

    %% Route to Middleware
    routes_auth --> middleware_auth
    routes_bookings --> middleware_auth
    routes_floors --> middleware_auth
    routes_devices --> middleware_auth

    %% Middleware to Services
    middleware_auth --> service_auth
    middleware_auth --> service_booking
    middleware_auth --> service_layout
    middleware_auth --> service_device

    %% MQTT Listener to Database and WebSocket trigger
    mqtt_listener -- "Write Statuses" --> mongoose_models
    mqtt_listener -- "Emit Status" --> socket_context

    %% Services to Models
    service_auth --> mongoose_models
    service_booking --> mongoose_models
    service_layout --> mongoose_models
    service_device --> mongoose_models
```

---

### 2. Component Descriptions

*   **API Client (Axios Wrapper):** Handles global interception for attaching authorization headers (`Bearer <token>`) and standardizes client-side HTTP error processing.
*   **Auth Middleware:** Inspects JWT tokens from headers, validates signatures, decodes payload info, and checks user authorization scopes (Student, Librarian, Admin) before letting the execution context proceed.
*   **MQTT Subscription Client:** An independent event loop instance that subscribes to the broker topics. It runs validation algorithms, handles reconnection delays, and is decoupled from standard HTTP APIs.
*   **Mongoose Models Layer:** Validates data schemas before passing records to MongoDB. Includes auto-indexing definitions and pre-save hooks (e.g. encrypting user password strings).
