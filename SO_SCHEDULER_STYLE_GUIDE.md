# so-scheduler Style & Architecture Guide

This guide documents the design system, styling rules, tech stack, and conventions used across `so-scheduler` (and `so-scheduling-viewer`).

---

## 1. Tech Stack & Frameworks

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Package Manager**: `pnpm` (configured across workspace with root `package.json` and `pnpm-workspace.yaml`)
- **Workspace Dev Commands**:
  - `pnpm dev`: Runs all 3 apps (`so-scheduling` on 3000, `so-scheduling-viewer` on 3001, `so-hub` on 3002) in parallel.
  - `pnpm dev:hub`: Runs only `so-hub` (port 3002).
  - `pnpm dev:viewer`: Runs only `so-scheduling-viewer` (port 3001).
  - `pnpm dev:admin`: Runs only `so-scheduling` (port 3000).
- **Centralized Environment**: All sub-apps (`so-hub`, `so-scheduling`, `so-scheduling-viewer`) link their environment loading directly to the monorepo `.env` file at `/home/nick/code/soaring-eagles/so-scheduler/.env`, guaranteeing native Next.js environment loading on server startup.
- **React**: React 19
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` & `@theme inline`)
- **Icons**: Lucide React (`lucide-react`)
- **Date Utility**: `moment` (with UTC date handling)
- **Internationalization**: `next-intl` (`[locale]` dynamic routing, support for `en` and `zh`)
- **Database & ORM**: MongoDB via `mongoose` (shared `events` collection)

---

## 2. Color Palette & Theme Tokens (Catppuccin Mocha)

The application uses **Catppuccin Mocha** as its core dark theme palette:

| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `background` / `base` | `#1e1e2e` | Primary background color |
| `mantle` | `#181825` | Header, secondary backgrounds, modal containers |
| `crust` | `#11111b` | Deep background / input backgrounds |
| `rosewater` | `#f5e0dc` | **Show Titles** (Bright Rosewater text for event headers) |
| `surface0` | `#313244` | Card background, active state background |
| `surface1` | `#45475a` | Borders, subtle dividers, scrollbar thumb |
| `surface2` | `#585b70` | Hover states for cards & buttons |
| `text` / `foreground` | `#cdd6f4` | Primary text color |
| `subtext1` | `#bac2de` | Secondary body text |
| `subtext0` | `#a6adc8` | Muted labels / subtext |
| `overlay2` | `#9399b2` | Subtle icons & placeholders |
| `overlay0` | `#6c7086` | Disabled states / dim text |
| `accent` | `#cba6f7` | Mauve accent (active buttons, highlights, badges) |

### Status & Indicator Colors
- **Fully Staffed / Green**: `#a6e3a1` (Green)
- **Partially Staffed / Yellow**: `#f9e2af` (Yellow)
- **Unstaffed / Danger / Red**: `#f38ba8` (Red)

---

## 3. CSS & Tailwind Config (`globals.css`)

```css
@import "tailwindcss";

:root {
  --background: #1e1e2e;
  --foreground: #cdd6f4;
  --accent: #cba6f7;
  
  /* Catppuccin Mocha */
  --base: #1e1e2e;
  --mantle: #181825;
  --crust: #11111b;
  --text: #cdd6f4;
  --subtext1: #bac2de;
  --subtext0: #a6adc8;
  --overlay2: #9399b2;
  --overlay1: #7f849c;
  --overlay0: #6c7086;
  --surface2: #585b70;
  --surface1: #45475a;
  --surface0: #313244;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-base: var(--base);
  --color-mantle: var(--mantle);
  --color-crust: var(--crust);
  --color-text: var(--text);
  --color-subtext1: var(--subtext1);
  --color-subtext0: var(--subtext0);
  --color-overlay2: var(--overlay2);
  --color-overlay1: var(--overlay1);
  --color-overlay0: var(--overlay0);
  --color-surface2: var(--surface2);
  --color-surface1: var(--surface1);
  --color-surface0: var(--surface0);
}
```

---

## 4. UI Component Design Conventions

- **Card Styling**:
  - Background: `bg-[#313244]/60` or `bg-[#181825]/80`
  - Border: `border border-[#45475a]/40`
  - Corner radius: `rounded-xl` or `rounded-lg` (clean, subtle rounded corners)
  - Backdrop blur: `backdrop-blur-md`
- **Typography & Font Stack**:
  - System UI font stack (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto...`)
- **Buttons**:
  - Primary button: `bg-[#cba6f7] text-[#11111b] font-semibold hover:bg-[#b4befe]`
  - Secondary button: `bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a]`
- **Formatting Conventions**:
  - Phone Numbers: Formatted as `XXX-XXX-XXXX` with `tel:` links.
  - Emails: Formatted with `mailto:` links.
  - Staffing Indicators: Displayed as `(Assigned/Needed)` with green/yellow/red color coding.
