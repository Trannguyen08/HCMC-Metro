# Admin ticket status UI inspection

## Files inspected
- `frontend/src/app/(routes)/admin/tickets/page.tsx`
- `frontend/src/components/ui/badge.tsx`
- `references/admin.md`
- `CLAUDE.md`

## Exact file where ticket status is rendered
Primary status rendering for the admin tickets table is in:

- `frontend/src/app/(routes)/admin/tickets/page.tsx`

There are two status display locations in that file:

1. **Scan result card**
   - Inside the `scanCard` summary block under the QR scanning card
   - Current rendering:
   ```tsx
   <div className="text-sm font-semibold">{getStatusLabel(scanCard.status)}</div>
   ```
   - This is plain text only, with no badge/background styling.

2. **Tickets table status column**
   - Inside the `<td>` for `Trang thai`
   - Current rendering:
   ```tsx
   <Badge variant={ticket.status === "active" ? "default" : "outline"} className={ticket.status === "active" ? "bg-emerald-500" : ""}>
     {ticket.status}
   </Badge>
   ```
   - Current behavior:
     - `active`: green solid badge via `variant="default"` plus `bg-emerald-500`
     - all other statuses: outline badge with no colored background
     - label uses raw backend value (`active`, `used`, `expired`, etc.), not `getStatusLabel(...)`

## Badge component behavior
In `frontend/src/components/ui/badge.tsx`:

- `default` variant gives a filled badge background
- `outline` variant only gives text color and border styling
- `className` can be used to add custom Tailwind background/text/border classes directly
- No special status variants currently exist, so the smallest change should stay in the admin tickets page rather than extending shared badge variants

## Minimal UI change recommended
Implement a tiny local helper in `frontend/src/app/(routes)/admin/tickets/page.tsx`:

1. Add a function like:
```tsx
const getStatusBadgeClassName = (status: string) => {
  if (status === "active") return "border-transparent bg-emerald-100 text-emerald-700";
  if (status === "used") return "border-transparent bg-sky-100 text-sky-700";
  if (status === "expired") return "border-transparent bg-amber-100 text-amber-700";
  if (status === "cancelled") return "border-transparent bg-rose-100 text-rose-700";
  if (status === "pending") return "border-transparent bg-slate-100 text-slate-700";
  return "border-transparent bg-slate-100 text-slate-700";
};
```

2. Update the table status badge to always use `variant="outline"` and apply the local class helper:
```tsx
<Badge variant="outline" className={getStatusBadgeClassName(ticket.status)}>
  {getStatusLabel(ticket.status)}
</Badge>
```

3. Optionally style the scan result card status value with the same badge for consistency:
```tsx
<Badge variant="outline" className={getStatusBadgeClassName(scanCard.status)}>
  {getStatusLabel(scanCard.status)}
</Badge>
```

## Why this is the minimal safe change
- Only one frontend page needs editing:
  - `frontend/src/app/(routes)/admin/tickets/page.tsx`
- No API changes
- No shared component contract changes
- Reuses existing `Badge` component and current Tailwind design language already used elsewhere in the page (`bg-emerald-50`, `bg-rose-50`, `bg-slate-50`, etc.)
- Keeps styles local to ticket admin instead of introducing new global badge variants for a single screen

## Proposed status color mapping
- `active` → `bg-emerald-100 text-emerald-700`
- `used` → `bg-sky-100 text-sky-700`
- `expired` → `bg-amber-100 text-amber-700`
- `cancelled` → `bg-rose-100 text-rose-700`
- `pending` → `bg-slate-100 text-slate-700`

This matches the existing page palette:
- success states already use emerald
- error/cancel states already use rose
- neutral UI already uses slate
- warning state fits amber

## Notes for parent agent
- The only exact file that needs a code change for colored status backgrounds is:
  - `frontend/src/app/(routes)/admin/tickets/page.tsx`
- `frontend/src/components/ui/badge.tsx` does **not** need modification for the minimal approach.
- Current table status text should likely switch from raw `ticket.status` to `getStatusLabel(ticket.status)` for consistency with the rest of the page.