# Admin Theme Reference

No new design system — this extends the **locked Phase 0 tokens** from the
customer app to the admin-specific patterns (tables, logs, tickets, config
forms). If you're about to reach for a new hex code or font, stop — it's
already in here or it shouldn't be used.

## Palette (unchanged from Phase 0)
| Token | Value | Use |
|---|---|---|
| Primary | `#4F46E5` | Buttons, active nav, links, focus rings |
| Success / Accent | `#10B981` | Approved, active, verified states |
| Warning | `#F59E0B` | Pending states |
| Error | `#EF4444` | Rejected, suspended, expired, form errors |
| Background | `#F9FAFB` | Page background |
| Surface | `#FFFFFF` | Cards, sidebar, navbar, table backgrounds |
| Border | `#E5E7EB` | All borders/dividers |
| Text primary | `#111827` | Headings, body |
| Text muted | `#6B7280` | Labels, timestamps, placeholders |

## Typography
- Font: Inter, all weights.
- Page title: `text-lg font-semibold text-[#111827]`
- Section label: `text-xs font-medium uppercase tracking-wide text-[#6B7280]`
- Body: `text-sm text-[#111827]`
- Muted/meta: `text-xs text-[#6B7280]`

## Radius
- Cards / panels / tables: `rounded-card` (12px, already in tailwind config)
- Buttons / inputs / badges: `rounded-lg` (8px)
- Avatars / status dots: `rounded-full`

## Buttons
```
Primary:   bg-[#4F46E5] text-white px-4 py-2 rounded-lg text-sm font-medium
Secondary: border border-[#E5E7EB] text-[#111827] px-4 py-2 rounded-lg text-sm
Danger:    bg-[#EF4444] text-white px-4 py-2 rounded-lg text-sm font-medium
Disabled:  opacity-60, no other color change
```

## Cards
```
rounded-card border border-[#E5E7EB] bg-white p-5
```
Flat, 1px border, no shadow at rest. Only add `hover:shadow-sm` on
clickable cards (e.g. a customer row that opens a detail view).

## Tables (`DataTable.jsx`)
- Header row: `text-[#6B7280]`, bottom border, no fill
- Body rows: `border-b border-[#E5E7EB] last:border-0`, no zebra striping
- Never introduce a new table component — every list view (Users,
  Payments, Uploads, Tickets) goes through `DataTable`.

## Status badges
Use these exact class combos everywhere a status appears (Users, Billing,
Uploads, Tickets, Connected Accounts) so "active" looks the same on every
page:
```
active / verified / approved / resolved  -> bg-emerald-100 text-emerald-700
pending / draft                          -> bg-amber-100 text-amber-700
suspended / rejected / expired / failed  -> bg-red-100 text-red-700
disconnected / closed / draft            -> bg-gray-100 text-gray-700
```

## Forms
- Label: `text-sm font-medium text-[#111827] mb-1`
- Input: `rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none`
- Error state: swap border to `border-[#EF4444]`, error text `text-xs text-[#EF4444]`
- Toggle switches (`ConfigPanel.jsx`): `bg-[#4F46E5]` when on, `bg-[#E5E7EB]` when off

## Spacing
- Page padding: `p-6`
- Card internal padding: `p-5`
- Vertical rhythm between sections: `space-y-6`
- Gap between inline elements (icon+label, avatar+name): `gap-2`

## Icons
Lucide only, `size={16}` inline with text, `size={18}`–`20` standalone
(navbar/sidebar icons).
