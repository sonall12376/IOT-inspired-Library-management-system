# Business Requirements Document (BRD)
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Business Objectives & Goals
The primary business objective of SmartLibrary AI is to maximize the utilization efficiency of physical study spaces in institutional libraries.

*   **Increase Active Capacity:** Improve active seating capacity by 25-35% by eliminating "seat hogging" (phantom seating).
*   **Reduce Operational Waste:** Minimize the manual hours spent by library staff monitoring and checking seat utilization.
*   **Enhance Student Satisfaction:** Reduce the average time a student spends finding a seat from 12 minutes to under 1 minute.
*   **Data-Driven Decision Making:** Provide library administrators with actionable usage analytics to plan structural additions or adjust library opening/closing schedules.

### 2. Stakeholder Analysis
*   **Students/Researchers (End Users):** Require an easy, real-time method to check seat availability, find specific seat types (quiet zones, collaborative tables, outlets), and book slots.
*   **Librarians (Operations & Compliance):** Need a single dashboard to view seat occupancy, handle student complaints, override invalid bookings, and get alerted to seat hogging or device failures.
*   **Library/University Administrators (Sponsors):** Require high-level analytics to review efficiency metrics, evaluate seat occupancy ROI, and manage library capacities.
*   **IT Department / DevOps Team (System Administrators):** Responsible for maintaining system uptime, managing IoT devices, handling network security, and database backups.

### 3. Project Scope
#### In-Scope:
*   Real-time floor map rendering and UI updates on web dashboards.
*   Physical seat occupancy monitoring via ESP32 sensor hardware using Ultrasonic/IR sensors.
*   Booking and reservation management logic (including check-in, check-out, and auto-cancellations).
*   Analytics dashboards displaying daily/weekly utilization rates, peak hours, and sensor statuses.
*   Role-Based Access Control (RBAC) supporting Admin, Librarian, and Student roles.

#### Out-of-Scope:
*   Physical payment processing for reserving premium rooms or seats (can be integrated via extensions later).
*   Integration with campus access turnstiles (though APIs will support webhooks for future integrations).
*   Hardware design/manufacturing of custom ESP32 casing (standard, pre-assembled cases assumed).

### 4. Business Constraints
*   **Network Dependability:** Libraries are often concrete-heavy structures where Wi-Fi signals can drop. The system must degrade gracefully if a sensor disconnects.
*   **Privacy Compliance (GDPR/FERPA):** The IoT sensors must only detect physical presence (Occupied vs. Vacant) and must **never** record images, audio, or capture personally identifiable information (PII) of the student sitting there.
*   **Hardware Cost Budgets:** The cost per seat for hardware components (ESP32, sensors, wiring, power source) must be kept below $15 USD.

### 5. Financial & Operational Benefits
*   **Avoided Construction Costs:** Optimizing existing seating layouts delays the need to construct or lease additional library physical spaces.
*   **Asset Lifecycle Optimization:** Automated tracking of high-traffic zones ensures maintenance schedules (cleaning, power repairs) are targeted precisely.
