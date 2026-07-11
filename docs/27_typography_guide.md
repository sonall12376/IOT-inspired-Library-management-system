# Typography Guide
## SmartLibrary AI - IoT Based Smart Library Seat Management System

SmartLibrary AI uses a clean, sans-serif typographic scale based on **Inter** (for body copy, controls, and numbers) and **Outfit** (for headings and titles) to ensure readability at a glance.

---

### 1. Font Families

*   **Primary Heading Font (Outfit):** A modern geometric sans-serif that projects high-end clarity. Available via Google Fonts.
    *   *CSS:* `font-family: 'Outfit', sans-serif;`
*   **Body & System Font (Inter):** Highly legible at small sizes, excellent character spacing, and clean numerical rendering for timers and coordinates.
    *   *CSS:* `font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;`

---

### 2. Typographic Hierarchy Scale

| Type Role | Font Family | Size | Weight | Line Height | Tailwind Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 (Hero Heading)**| Outfit | 30px (`1.875rem`) | 700 (Bold) | 36px | `font-outfit text-3xl font-bold tracking-tight` | Landing headers, Dashboard Welcome |
| **H2 (Section Title)**| Outfit | 24px (`1.5rem`) | 600 (Semi-Bold) | 32px | `font-outfit text-2xl font-semibold` | Page sections, Modal headings |
| **H3 (Card Title)** | Outfit | 18px (`1.125rem`) | 600 (Semi-Bold) | 28px | `font-outfit text-lg font-semibold` | Room names, Widget titles |
| **Body (Regular)** | Inter | 14px (`0.875rem`) | 400 (Regular) | 20px | `font-inter text-sm font-normal` | Table content, forms, descriptions |
| **Body Medium** | Inter | 14px (`0.875rem`) | 500 (Medium) | 20px | `font-inter text-sm font-medium` | Button labels, selected navigation |
| **Small / Captions** | Inter | 12px (`0.75rem`) | 400 (Regular) | 16px | `font-inter text-xs text-slate-500` | Device MAC addresses, timestamps |
| **Code / MAC Monospace**| JetBrains Mono| 13px (`0.8125rem`) | 500 (Medium) | 18px | `font-mono text-xs tracking-wide` | MQTT topics, device diagnostics |

---

### 3. Responsive Typography Rules
*   For mobile screens (width < 768px), headers shrink by one scale step:
    *   H1 -> `text-2xl`
    *   H2 -> `text-xl`
    *   H3 -> `text-base`
*   Body copy size remains static at `text-sm` (`14px`) to preserve reading legibility, as smaller text increases squinting during dashboard reviews.
