# Responsive Design Rules
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document lists the rules and layout adaptation behaviors required to ensure SmartLibrary AI operates on mobile devices, tablets, and large screens.

---

### 1. CSS Breakpoints Reference
We align with standard Tailwind CSS breakpoints:
*   **Mobile / Small (`sm`):** `640px`
*   **Tablet (`md`):** `768px`
*   **Desktop (`lg`):** `1024px`
*   **Widescreen (`xl`):** `1280px`
*   **Extra Large (`2xl`):** `1536px`

---

### 2. Layout Adaptations By Screen Size

#### 2.1 Navigation Bar & Sidebar
*   **lg and above:** Persistent left sidebar layout. Full text links, user avatar visible at bottom.
*   **md to lg:** Collapsed sidebar layout (icons only).
*   **sm to md (Mobile):** Sidebar hidden. Replaced with bottom navigation bar (Home, Search/Map, My Bookings, Profile) with touch-friendly icons.

#### 2.2 Interactive Seat Grid
*   **lg and above:** Standard grid representation. Map occupies 70% of screen width, booking control sidebar occupies 30%.
*   **md to lg:** Map occupies full width. The booking selector shifts from a sidebar to a slide-up bottom drawer (`y: 0` from bottom screen edge).
*   **sm (Mobile):** The grid container receives `overflow-auto` allowing users to swipe/pan the library layout map. A pinch-to-zoom instruction notice is overlayed.

---

### 3. Touch Target and Input Guidelines
*   **Min Click Size:** All seat items on the map, buttons, and navigation nodes must maintain a minimum bounding target size of **44 x 44 pixels** on screens below `768px` to comply with WCAG 2.1 touch criteria.
*   **Tooltips:** On mobile, hovering does not exist. Tooltips must trigger on **first tap** (focus), and reservation confirmation triggers on the **second tap** or via an explicit "Book Selected Seat" button inside the bottom drawer.
*   **Native Pickers:** Date/Time selection elements must invoke native iOS/Android picker interfaces rather than custom modal wheels to provide a native mobile experience.
