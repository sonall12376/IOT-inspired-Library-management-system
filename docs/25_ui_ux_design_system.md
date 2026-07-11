# UI/UX Design System
## SmartLibrary AI - IoT Based Smart Library Seat Management System

SmartLibrary AI's interface is designed around the principles of **visual clarity, responsiveness, and premium interactivity**, drawing design inspiration from Stripe, Apple, and Linear. It utilizes a **glassmorphic** style (semi-transparent backdrops, subtle card borders, and high blur metrics) combined with clean layout boundaries.

---

### 1. Visual Theme & Philosophy

#### 1.1 Glassmorphism Specifications
All layout cards and sidebars must utilize the following Tailwind CSS / custom classes:
*   **Backdrop Filter:** `backdrop-blur-md` (minimum 12px blur).
*   **Background Opacity:** Light Mode: `rgba(255, 255, 255, 0.7)`. Dark Mode: `rgba(15, 23, 42, 0.6)`.
*   **Border:** `1px solid rgba(255, 255, 255, 0.12)` (or `border-white/10`).
*   **Drop Shadow:** Subtle, diffuse shadows (`shadow-xl shadow-black/5`).

#### 1.2 Interactive Micro-Animations
*   **Scale Hover:** Any clickable seat node, button, or menu item must scale by `scale-102` or `scale-105` over `200ms` with an `ease-out` transition.
*   **Status Cross-fades:** Seat color transitions (e.g. Yellow to Red) must not click-flash. The color values must shift smoothly using a `duration-500` cross-fade.

---

### 2. Component Design Specifications

#### 2.1 Seat Map Node (Grid Elements)
*   **Shape:** Rounded squares (`rounded-lg`).
*   **Visual Indicators:**
    *   *Vacant:* Soft green background (`bg-emerald-500/10`), emerald border (`border-emerald-500/30`), green text.
    *   *Occupied:* Soft red background (`bg-rose-500/10`), rose border (`border-rose-500/30`), red text.
    *   *Reserved:* Soft yellow background (`bg-amber-500/10`), amber border (`border-amber-500/30`), blinking amber dot in corner.
    *   *Offline / Maintenance:* Soft gray (`bg-slate-500/10`), slate border (`border-slate-500/20`), grey text.

```
+─────────────────────+
| [●]           S-101 |
|                     |
|      (Outlet)       |
+─────────────────────+
```

#### 2.2 Skeleton Loaders
*   To eliminate page layouts jumping around when fetching data, card grids must render a pulsing loading state:
    *   `animate-pulse`
    *   `bg-slate-200` (Light) or `bg-slate-800` (Dark) with matching border shapes.

---

### 3. Usability & Accessibility Rules
1.  **Keyboard Navigation:** All interactive modal components, buttons, and seat items must support `tabindex` mapping and visible focus states (`focus-visible:ring-2 focus-visible:ring-indigo-500`).
2.  **Color Contrast (WCAG):** Any textual element overlaid on status backgrounds must meet a minimum contrast ratio of `4.5:1` against its backdrop. Text colors must use high contrast alternatives (e.g., `text-rose-700` inside a `bg-rose-50` backdrop).
3.  **Aria Roles:** Floor map SVGs must have `aria-label` tags describing floor layouts, and seat items must possess tags describing state: `aria-label="Seat S-101, Vacant, Power Outlet Available"`.
4.  **No Layout Shifts (CLS):** Set fixed grid dimensions for maps using CSS Aspect Ratio rules (`aspect-square` or `aspect-[4/3]`) to reserve screen space prior to WebSocket population.
