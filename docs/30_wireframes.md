# Wireframes Reference Guide
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document provides visual ASCII wireframe blueprints and structural layout outlines for all the core screens in the SmartLibrary AI dashboard.

---

### 1. Screen 1: Login Page

```
+───────────────────────────────────────────────────────────────+
|                                                               |
|                      [ SmartLibrary AI ]                      |
|                 Real-time Seat Management                     |
|                                                               |
|                 +---------------------------+                 |
|                 |                           |                 |
|                 |          Sign In          |                 |
|                 |                           |                 |
|                 |  Email                    |                 |
|                 |  [ jane.doe@univ.edu    ] |                 |
|                 |                           |                 |
|                 |  Password                 |                 |
|                 |  [ ****************     ] |                 |
|                 |                           |                 |
|                 |  [ ] Remember me          |                 |
|                 |                           |                 |
|                 |  +---------------------+  |                 |
|                 |  |       Sign In       |  |                 |
|                 |  +---------------------+  |                 |
|                 |                           |                 |
|                 +---------------------------+                 |
|                                                               |
+───────────────────────────────────────────────────────────────+
```
*   **Aesthetics:** Dark mode Slate backdrop, centered glassmorphic login card with diffuse shadow.

---

### 2. Screen 2: Student Dashboard & Live Seat Map

```
+───────────────────────────────────────────────────────────────────────────────+
| SmartLibrary AI | [First Floor  ▼]  Occupancy: 64/100 (64%) | (Avatar) Jane   |
+─────────────────+──────────────────────────────────+──────────────────────────+
|  (Nav Sidebar)  |          Visual Floor Layout Map  | (Booking Sidebar)        |
|  [🏠 Dashboard] |  +-----------------------------+  | +----------------------+ |
|  [🗺️ Live Map]  |  |  [S1-V] [S2-O] [S3-V] [S4-R] |  | | Seat Details: S-104  | |
|  [📅 Bookings]  |  |  [S5-O] [S6-V] [S7-M] [S8-V] |  | | Floor: 1st Floor     | |
|  [📊 Profile]   |  |                              |  | | Type: Individual     | |
|                 |  |  [S9-V] [S10-V]    [S11-V]   |  | | Power Outlets: Yes   | |
|                 |  +-----------------------------+  | |                      | |
|                 |  Legend:                          | | Reservation Timeslot | |
|                 |  [V] Vacant (Green)               | | [ 09:00 AM - 11:00 ] | |
|                 |  [O] Occupied (Red)               | |                      | |
|                 |  [R] Reserved (Yellow)            | | +------------------+ | |
|                 |  [M] Maintenance (Gray)           | | |  Confirm Booking | | |
|                 |                                   | | +------------------+ | |
|                 |                                   | +----------------------+ |
+─────────────────+──────────────────────────────────+──────────────────────────+
```
*   **Aesthetics:** Left-aligned navigation sidebar. Dynamic SVG seat elements arranged in a visual grid, showing tooltips on hover. Booking panel slides in from the right edge with spring animation.

---

### 3. Screen 3: Librarian Operations Panel

```
+───────────────────────────────────────────────────────────────────────────────+
| SmartLibrary AI | [Floor 1] [Librarian Mode]               | (Avatar) John (L) |
+─────────────────+─────────────────────────────────────────────────────────────+
|  (Nav Sidebar)  |  +-------------------------------------------------------+  |
|  [🏠 Dashboard] |  | Selected Seat: S-102 (Occupied - Sensor active 14m)    |  |
|  [🗺️ Live Map]  |  | Occupant: Jane Doe (ID: 2026842)                          |  |
|  [⚙️ Operations] |  | Status: Occupied                                      |  |
|  [🔌 Devices]   |  +-------------------------------------------------------+  |
|                 |  | [Release Booking (Override)]    [Set Maintenance Mode] |  |
|                 |  +-------------------------------------------------------+  |
|                 |                                                             |
|                 |  Live Violations & Alerts List:                             |
|                 |  - Seat S-104: Booking Pending check-in (12m remaining)     |
|                 |  - [!] Device S-108 reported no-occupancy (Absence: 06m)   |
|                 |  - [X] Device S-112 Offline (Signal RSSI critical)          |
+─────────────────+─────────────────────────────────────────────────────────────+
```

---

### 4. Screen 4: Admin Floor Grid Designer

```
+───────────────────────────────────────────────────────────────────────────────+
| SmartLibrary AI | Layout Designer: Floor 1                 | (Avatar) Super    |
+─────────────────+─────────────────────────────────────────────────────────────+
|  (Nav Sidebar)  |  Grid Designer Tools: [Add Seat] [Define Wall] [Save Map]   |
|  [🏠 Dashboard] |  +-------------------------------------------------------+  |
|  [🗺️ Live Map]  |  |   01   02   03   04   05   06   07   08   09   10       |  |
|  [⚙️ Operations] |  | A [S1] [S2] [  ] [  ] [W ] [W ] [S3] [S4] [S5] [  ]     |  |
|  [🔧 Layouts]   |  | B [S6] [S7] [  ] [  ] [W ] [W ] [  ] [  ] [  ] [  ]     |  |
|  [📜 Audits]    |  | C [S8] [  ] [  ] [  ] [  ] [  ] [S9] [S10][  ] [  ]     |  |
|                 |  +-------------------------------------------------------+  |
|                 |  Click on grid node to configure properties:                |
|                 |  - Seat ID: S-109       - Sensor ID (MAC): [24:0A:...  ] |
+─────────────────+─────────────────────────────────────────────────────────────+
```

---

### 5. Screen 5: Device Diagnostics / Network Panel

```
+───────────────────────────────────────────────────────────────────────────────+
| SmartLibrary AI | IoT Device Registry & Diagnostics      | (Avatar) Super    |
+─────────────────+─────────────────────────────────────────────────────────────+
|  (Nav Sidebar)  | Search Devices: [ Search MAC / Seat...          ] [Register]|
|  [🏠 Dashboard] |                                                             |
|  [🗺️ Live Map]  | MAC Address        Seat   Status   RSSI   Battery   Uptime    |
|  [⚙️ Operations] | 24:0A:C4:8B:58:FC  S-101  ONLINE   -67dB  88%       04d 12h   |
|  [🔧 Layouts]   | 24:0A:C4:8B:22:AA  S-102  ONLINE   -74dB  12% (Low) 01d 04h   |
|  [🔌 Devices]   | 24:0A:C4:8B:44:CC  S-103  OFFLINE  ---    ---       00s       |
|  [📜 Audits]    |                                                             |
|                 | Actions: [Reboot Node]  [Fetch Signal Trace]  [Edit Bind]   |
+─────────────────+─────────────────────────────────────────────────────────────+
```

---

### 6. Screen 6: Analytics & Occupancy Reports Panel

```
+───────────────────────────────────────────────────────────────────────────────+
| SmartLibrary AI | Historical Analytics Reports             | (Avatar) Super    |
+─────────────────+─────────────────────────────────────────────────────────────+
|  (Nav Sidebar)  | Range: [ Last 7 Days ▼ ]   Type: [ Seating Capacity ▼ ]      |
|  [🏠 Dashboard] |                                                             |
|  [🗺️ Live Map]  | Hourly Seating Occupancy Waveform:                         |
|  [📈 Analytics] | 100%|                /\                                     |
|  [📜 Audits]    |  50%|   /\          /  \         /\                         |
|                 |   0%|__/──\________/────\_______/──\____                     |
|                 |     08:00   12:00   16:00   20:00   24:00                   |
|                 |                                                             |
|                 | Key Performance Indicators:                                 |
|                 | - Peak Hours: 01:00 PM - 03:00 PM (Avg. 94% occupancy)      |
|                 | - Average Seat Reservation Duration: 135 minutes            |
|                 | - Most Popular Zone: Floor 1 Window Desks                   |
+─────────────────+─────────────────────────────────────────────────────────────+
```
*   **Aesthetics:** Seamless graphs styled with indigo and violet color maps using responsive canvas libraries.
*   **Interactions:** Hovering over points on the line graph opens detailed popovers.
*   **Download Options:** Buttons to export data to CSV and PDF configurations.
