# AI Social Media Manager — Customer Portal

Frontend-only customer portal for the AI Social Media Manager service, built for a 3-day internship sprint (Pascal & Treasure).

## Tech Stack

- **React 18 + Vite** — fast dev server, no unnecessary config
- **Tailwind CSS** — utility-first styling, design tokens in `tailwind.config.js`
- **React Router v6** — routing (see `src/routes/AppRoutes.jsx`)
- **Lucide React** — icon set (don't mix in other icon libraries)
- **Recharts** — charts (Analytics page)
- **Framer Motion** — optional animation, add where it helps, don't force it everywhere
- **React Hook Form** — form state/validation (Login, Sign Up, Contact, forms in Settings)
- **Zustand** — lightweight global state if Context gets unwieldy (optional, not wired up yet)
- **date-fns** — date handling for the Content Calendar
- **clsx + tailwind-merge** (via `src/utils/cn.js`) — safe conditional Tailwind classes

> **Why these extras beyond the original list?** `react-hook-form` saves real time on the Login/Sign Up/Settings forms instead of hand-rolling `useState` per field. `date-fns` is close to mandatory for a real calendar page. `clsx`/`tailwind-merge` prevent class-conflict bugs in reusable components (see `cn.js`). `zustand` is included but optional — Context is wired up already in `AuthContext.jsx` and is enough for this project's size; only reach for zustand if state sharing gets messy.

## Getting Started

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Folder Structure

```
src/
├── assets/              Images, illustrations exported from Stitch
├── components/
│   ├── ui/               Generic reusable primitives (Button, Input, Card, Badge, Modal, Loader, Avatar, EmptyState)
│   ├── layout/            Structural pieces (Sidebar, Navbar, PageHeader, Footer)
│   └── charts/            Chart-adjacent components (StatsCard, etc.)
├── layouts/              Page shells: DashboardLayout, AuthLayout, OnboardingLayout
├── pages/
│   ├── Landing.jsx, Pricing.jsx, Contact.jsx      (public marketing pages)
│   ├── Auth/                                      Login, SignUp, ForgotPassword
│   ├── Onboarding/                                ChoosePlan, Payment, PaymentVerification
│   └── Dashboard/                                 DashboardHome, Analytics, Channels, ContentCalendar,
│                                                    Uploads, AISuggestions, Billing, Support,
│                                                    Notifications, Settings
├── routes/
│   └── AppRoutes.jsx      Single source of truth for every route — mirrors the 20-prompt Stitch sequence 1:1
├── context/
│   └── AuthContext.jsx    Placeholder auth + subscription state
├── hooks/                 Custom hooks go here
└── utils/
    ├── cn.js              className merge helper — use in every new component
    └── constants.js       Shared constants (plans, platform list, etc.)
```

**Rule of thumb:** if a piece of UI is used on 2+ pages, it belongs in `components/`, not copy-pasted inside a page file.

## Design System (do not deviate — see Phase 0/1 docs for full rationale)

| Token | Value |
|---|---|
| Primary | `#4F46E5` (`bg-primary`, `text-primary`) |
| Accent/success | `#10B981` (`bg-accent`) |
| Warning / Danger | `#F59E0B` / `#EF4444` |
| Font | Inter (already loaded in `index.html`) |
| Card radius | `rounded-card` (12px) |
| Button/input radius | `rounded-control` (8px) |

All of these are defined in `tailwind.config.js` — use the named classes (`bg-primary`, `rounded-card`, etc.), not raw hex values, so a future color change only touches one file.

## Converting Stitch Designs → Code

1. Export/inspect the Stitch HTML for the page you're converting.
2. Open the matching placeholder in `src/pages/...` (folder structure above matches the Stitch prompt order exactly).
3. Rebuild the markup using Tailwind classes and the shared components in `components/ui` / `components/layout` wherever the Stitch design reuses a pattern already built (buttons, cards, badges, etc.) — don't hand-roll a new button style per page.
4. If a component doesn't exist yet and is reused across 2+ pages, add it to `components/`, then import it — don't duplicate.

## Routing Map

See `src/routes/AppRoutes.jsx` — every route is listed there with comments. Dashboard routes are not yet gated behind subscription status; wire that up via `AuthContext` once billing logic exists.

## Git Workflow

See `GIT_WORKFLOW.md` in the project root for the full branching strategy and day-to-day commands.
