# Role-Based Access Control (RBAC) Matrix
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document outlines the security boundaries and access permissions defined for the three core roles: Student, Librarian, and Administrator.

---

### 1. Permissions Matrix

| Feature Area | Action | Student | Librarian | Administrator |
| :--- | :--- | :---: | :---: | :---: |
| **Authentication** | Register / Login / View Profile | Yes | Yes | Yes |
| **Seat Map** | View Floor Maps & Occupancy | Yes | Yes | Yes |
| **Reservations** | Book empty seat for self | Yes | Yes | Yes |
| | Cancel personal reservations | Yes | Yes | Yes |
| | Book seat for *any* student | No | Yes | Yes |
| | Cancel reservation of *any* student (Override) | No | Yes | Yes |
| **Floor Layout** | Create/Update/Delete Floors & Rooms | No | No | Yes |
| | Create/Update/Delete Seat Nodes | No | No | Yes |
| **Devices** | View live diagnostics list (RSSI, Battery) | No | Yes | Yes |
| | Reboot device remotely | No | Yes | Yes |
| | Bind/Unbind device MAC address to Seat | No | No | Yes |
| **User Accounts** | Edit roles / Delete student accounts | No | No | Yes |
| **Security** | Read System Audit logs | No | No | Yes |

---

### 2. Route Protection mapping

Every incoming REST request passes through a validation middleware stack:
`validateJWT` -> `requireRole(['role1', 'role2'])`.

#### 2.1 Student Protected Routes
Allowed roles: `['student', 'librarian', 'admin']`
*   `GET /api/floors`
*   `GET /api/floors/:id/seats`
*   `POST /api/bookings`
*   `GET /api/bookings/my-reservations`
*   `PUT /api/bookings/:id/cancel` (Owner check enforced at service layer)

#### 2.2 Librarian Protected Routes
Allowed roles: `['librarian', 'admin']`
*   `PUT /api/seats/:id/override` (Release/Force Status changes)
*   `GET /api/devices`
*   `POST /api/devices/reboot`

#### 2.3 Admin Protected Routes
Allowed roles: `['admin']`
*   `POST /api/floors`
*   `PUT /api/floors/:id`
*   `DELETE /api/floors/:id`
*   `POST /api/seats`
*   `DELETE /api/seats/:id`
*   `POST /api/devices/bind`
*   `GET /api/admin/audit-logs`
*   `PUT /api/admin/users/:id/role`
