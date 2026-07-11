# Animation Guidelines
## SmartLibrary AI - IoT Based Smart Library Seat Management System

SmartLibrary AI utilizes **Framer Motion** to drive transitions. Animations are kept functional, subtle, and responsive, ensuring the app feels reactive rather than sluggish.

---

### 1. Motion Constants (Framer Motion Configs)

To keep motion unified across the app, we utilize standard configuration presets.

#### 1.1 Spring Transition (Modals & Sidebar Drawers)
Used for slide-in panels or popup dialogue components to simulate physical weight.
```typescript
export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8
};
```
*   **Target Properties:** `x`, `y`, `scale`

#### 1.2 Smooth Ease-Out (Menus & Page Transitions)
Used for fade-ins or simple opacity transitions.
```typescript
export const easeOutTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2
};
```
*   **Target Properties:** `opacity`, `height` (collapsible elements)

---

### 2. Core Interactive Animations

#### 2.1 Seat State Transition (Status Cross-fades)
*   **Action:** Changing seat status colors.
*   **Rule:** Standard color swaps are styled with CSS `transition-colors duration-500 ease-in-out` to cross-fade background and border colors smoothly.
*   **Pulsing State (Reserved):** Seats in `reserved` state must possess a slow, rhythmic scale pulse:
    ```typescript
    export const reservedPulse = {
      scale: [1, 1.03, 1],
      transition: {
        duration: 2.0,
        repeat: Infinity,
        ease: "easeInOut"
      }
    };
    ```

#### 2.2 Page Transitions (AnimatePresence)
*   All dashboard route swaps are wrapped in Framer Motion `<AnimatePresence mode="wait">` to transition views cleanly.
*   **Transition Effect:** Slide and Fade:
    *   *Initial (Entering):* `opacity: 0, x: -15`
    *   *Animate (Active):* `opacity: 1, x: 0`
    *   *Exit (Leaving):* `opacity: 0, x: 15`
    *   *Duration:* `0.2s` with `easeOutTransition`

#### 2.3 Sidebar Drawer Disclosure
*   **Action:** When clicking a seat, the booking drawer slides in from the right edge.
*   **Motion:**
    *   *Initial:* `x: "100%"`
    *   *Animate:* `x: 0`
    *   *Exit:* `x: "100%"`
    *   *Transition:* `springTransition`
