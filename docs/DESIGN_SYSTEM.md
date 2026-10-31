# BizoraVoice Design System: Sonic Obsidian & Studio Titanium

## 1. Design Token Architecture

The BizoraVoice design system establishes an unapologetically high-craft aesthetic tailored for deep-tech audio engineering and modern enterprise software.

### 1.1. Color Tokens

#### Dark Mode ("Sonic Obsidian")
```css
:root[data-theme='dark'], .dark {
  /* Canvas & Surfaces */
  --bg-canvas: #10110F;         /* Deepest obsidian bedrock */
  --bg-surface: #141612;        /* Card & panel surface */
  --bg-surface-elevated: #191B17;/* Modals, inputs, active states */
  --bg-surface-hover: #22241F;   /* Hover highlight */
  
  /* Hairline Borders */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-medium: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.20);
  --border-focus: rgba(230, 154, 72, 0.60);

  /* Typography */
  --text-primary: #F4F4F0;       /* Crisp reading white with warmth */
  --text-secondary: #9E9F99;     /* Balanced slate gray */
  --text-tertiary: #61635D;      /* Metadata & subdued tokens */

  /* Acoustic Amber Accents */
  --accent-amber: #E69A48;       /* Primary brand acoustic amber */
  --accent-amber-hover: #F3B866; /* Vibrant warm highlight */
  --accent-amber-subtle: rgba(230, 154, 72, 0.12);
  --accent-amber-glow: rgba(230, 154, 72, 0.25);

  /* Functional Telephony Status */
  --status-active: #22C55E;      /* VoLTE / Connected */
  --status-active-subtle: rgba(34, 197, 94, 0.14);
  --status-warning: #F59E0B;     /* Fallback / Latency spike */
  --status-error: #EF4444;       /* Disconnected / SIP error */
  --status-info: #38BDF8;        /* WebSocket telemetry */
}
```

#### Light Mode ("Warm Ivory & Studio Titanium")
```css
:root, .light {
  /* Canvas & Surfaces */
  --bg-canvas: #FAF8F5;         /* Warm linen canvas */
  --bg-surface: #FFFFFF;        /* Elevated white cards */
  --bg-surface-elevated: #F3EFEA;/* Inputs & dropdown containers */
  --bg-surface-hover: #EBE5DC;   /* Interactive hover */

  /* Hairline Borders */
  --border-subtle: rgba(0, 0, 0, 0.07);
  --border-medium: rgba(0, 0, 0, 0.12);
  --border-strong: rgba(0, 0, 0, 0.22);
  --border-focus: rgba(217, 119, 6, 0.70);

  /* Typography */
  --text-primary: #121311;       /* Deep charcoal */
  --text-secondary: #4A4D46;     /* High contrast body */
  --text-tertiary: #7D8078;      /* Supporting metadata */

  /* Accents */
  --accent-amber: #D97706;       /* Calibrated amber for light contrast */
  --accent-amber-hover: #B45309;
  --accent-amber-subtle: rgba(217, 119, 6, 0.10);
  --accent-amber-glow: rgba(217, 119, 6, 0.15);

  /* Status */
  --status-active: #15803D;
  --status-active-subtle: rgba(21, 128, 61, 0.12);
  --status-warning: #B45309;
  --status-error: #B91C1C;
  --status-info: #0284C7;
}
```

---

## 2. Typography Hierarchy

| Style Role | Font Family | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Sans-Serif (Geist/Inter) | 48px – 64px | 700 (Bold) | 1.05 | `-0.035em` |
| **Section Title (H1)** | Sans-Serif | 28px – 34px | 600 (Semibold) | 1.15 | `-0.025em` |
| **Panel Header (H2)** | Sans-Serif | 20px – 24px | 600 (Semibold) | 1.25 | `-0.02em` |
| **Card Title (H3)** | Sans-Serif | 15px – 16px | 600 (Semibold) | 1.35 | `-0.01em` |
| **Body Regular** | Sans-Serif | 14px | 400 (Regular) | 1.50 | `0` |
| **Body Small** | Sans-Serif | 13px | 400 (Regular) | 1.45 | `+0.005em` |
| **Metadata / Tags** | Sans-Serif | 11px – 12px | 500 (Medium) | 1.30 | `+0.02em` |
| **Telemetry / Code** | Monospace (Geist Mono/JetBrains) | 12px – 13px | 400 / 500 | 1.40 | `-0.01em` |

---

## 3. Component Geometry & Standards

### 3.1. Radii (Corner Geometry)
- **Base elements** (Buttons, inputs, inline badges): `rounded-lg` (`8px`)
- **Cards, drawers & modals**: `rounded-xl` (`12px` to `16px`)
- **Pills & Audio indicators**: `rounded-full` (`9999px`)
- *Anti-Pattern Notice*: No oversized `rounded-3xl` cards that create awkward empty negative spaces.

### 3.2. Button Styles
1. **Primary Button ("Acoustic Amber")**:
   - `bg-[#E69A48] hover:bg-[#F3B866] text-[#10110F] font-semibold shadow-sm hover:shadow-amber-500/20 transition-all duration-150 active:scale-[0.98]`
2. **Secondary Button ("Obsidian Titanium")**:
   - `bg-surface-elevated hover:bg-surface-hover text-primary border border-subtle hover:border-medium transition-all duration-150`
3. **Ghost Action**:
   - `text-secondary hover:text-primary hover:bg-surface-elevated transition-colors duration-150`
4. **Destructive Action**:
   - `text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors`

### 3.3. Input Fields
- Background: `bg-surface-elevated`
- Border: `border border-subtle focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40`
- Padding: `px-3.5 py-2.5 text-sm`
- Placeholder: `text-tertiary placeholder:text-tertiary`

---

## 4. Animation & Physics Standard

- **Transition Timing**: Fast, decisive feedback (`150ms` for hover/click, `250ms` for drawer sliding).
- **Easing Curve**: Apple/Emil Kowalski curve `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Composite-Only**: Animate strictly `transform` and `opacity` to avoid layout re-layouts and guarantee 60fps across low-power mobile devices.
- **Voice Pulse Aura**: Micro-expansion animation for active audio streams:
  ```css
  @keyframes sonicPulse {
    0% { transform: scale(0.98); opacity: 0.6; }
    50% { transform: scale(1.03); opacity: 1; }
    100% { transform: scale(0.98); opacity: 0.6; }
  }
  ```

---

## 5. The Voice Core 3D Object Specification

- **Dimension**: Scalable responsive canvas (`240px` to `360px` diameter).
- **Core Geometry**: Dual concentric geodesic rings with a central acoustic energy point.
- **Audio Dynamic Reactivity**:
  - `state === 'idle'`: Gentle 0.15Hz harmonic rotation, subtle amber particle drift.
  - `state === 'listening'`: Concentric rings contract and expand along normal vectors with microphone/simulated dB amplitude.
  - `state === 'processing'`: Rings accelerate spin; orbital particles stream toward the focal point.
  - `state === 'speaking'`: High-frequency harmonic oscillation with warm audio waves propagating outward.
  - `state === 'error'`: Rapid coral/red vibration (`#EF4444`) with immediate dampening.
- **Fallback**: High-performance SVG/Canvas2D harmonic wave system when WebGL is unavailable or reduced motion is preferred.
