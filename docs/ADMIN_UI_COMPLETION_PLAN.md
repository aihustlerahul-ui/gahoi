# Admin UI — 100% Completion Plan

**Goal:** Bring `apps/admin` + supporting backend admin APIs to full PRD Section 10 compliance.

**Current state:** ~65–70% complete. See audit in chat history / compare against PRD 10.1 and 10.2.

**Canonical domain:** `gahoisarthi.in` · Admin at `admin.gahoisarthi.in` (local: `http://localhost:3002`)

**Do not change:** Tech stack, monorepo structure, JWT RS256, cursor pagination, three-tier PII rules for member-facing APIs.

---

## PRD Section 10 — Definition of Done

### 10.1 Admin Panel Features (all must work end-to-end)

| Feature | Done when |
|---------|-----------|
| **Dashboard** | Shows: total users, active profiles, pending review, paid users, interests sent **today**, signups **today**, open reports. Charts: daily signups (30d), paid conversion rate, interest-to-match rate. Email open rates: show "N/A — not tracked" placeholder if Resend analytics not wired. |
| **Profile management** | List **all** profiles with filters (admin_status, gender, city, tier, verified, flagged). Full profile view (all sub-records + gallery signed URLs). Actions: Approve / Reject (with reason) / Suspend / Delete. Toggle **verified badge** after ID review. |
| **Interest management** | Paginated interest activity feed. Filter by sender, date, status. Highlight users exceeding daily send threshold (abuse signal). |
| **Subscription management** | Active + expired subscriptions list (exists on Revenue page — enhance with expiry filter). Manual tier override on Users page (exists). |
| **Reports queue** | Outcomes: **Warn** / **Suspend** / **Ban** / **Dismiss**. Reporter notified (email, no PII of outcome details). Profiles with **3+ open reports** auto-flagged in UI. |
| **Email broadcast** | Compose + send to segment: all / paid / free / inactive 30d+ via Resend. Preview + confirm. Uses `@gahoisarthi/email-templates` or new admin broadcast template. |
| **Success stories** | Members submit via app (future) — admin can list pending, publish/unpublish, edit testimonial text. Display on web homepage (stub OK if web not ready). |
| **Analytics** | Dashboard charts (see above). Export not required for Phase 1. |

### 10.2 Admin Roles (enforce on API + UI)

| Role | Access |
|------|--------|
| **super_admin** | Everything including subscription overrides, revenue, plans, email broadcast, admin user CRUD |
| **moderator** | Dashboard (read-only counts), profiles, photos, reports, interests (read-only). **No** users tier override, plans, revenue, email broadcast, admin management |

---

## Existing Assets (reuse — do not rewrite)

### Admin UI (`apps/admin`)

| Path | Purpose |
|------|---------|
| `src/components/AdminLayout.tsx` | Sidebar nav + badges |
| `src/components/Drawer.tsx` | Detail panel |
| `src/components/Modal.tsx` | Confirm dialogs |
| `src/app/login/page.tsx` | Admin OTP login |
| `src/app/(admin)/page.tsx` | Dashboard |
| `src/app/(admin)/profiles/page.tsx` | Pending profiles only — **extend** |
| `src/app/(admin)/photos/page.tsx` | Photo moderation ✅ |
| `src/app/(admin)/reports/page.tsx` | Reports — **extend outcomes** |
| `src/app/(admin)/users/page.tsx` | User management ✅ |
| `src/app/(admin)/plans/page.tsx` | Plans CRUD ✅ |
| `src/app/(admin)/revenue/page.tsx` | Revenue ✅ |
| `src/app/(admin)/push/page.tsx` | Push (Phase 2 — keep, hide from moderator nav) |
| `src/lib/api.ts` | API client |
| `src/lib/types.ts` | TS types |
| `src/app/globals.css` | Design tokens (dark sidebar + gold/cream) |

### Backend admin (`apps/backend/src/modules/admin/`)

| File | Purpose |
|------|---------|
| `admin.routes.ts` | All `/v1/admin/*` routes |
| `admin.service.ts` | Business logic |
| `admin.schema.ts` | Zod schemas |
| `admin-auth.routes.ts` | `/v1/admin-auth/*` OTP login |
| `middleware/auth-guard.ts` | `adminAuthGuard` sets `req.adminId`, `req.adminRole` |

### Email templates (`packages/email-templates/`)

Use for: profile approved/rejected, photo rejected, report outcome, broadcast, success story published.

---

## Work Phases (execute in order)

### Phase 1 — Backend: extend admin APIs

- [ ] **1.1** `GET /v1/admin/profiles` — add query filters: `status`, `gender`, `cityId`, `tier`, `verified`, `flagged`, `search` (email/profileId). Default `status=pending` preserves current behaviour.
- [ ] **1.2** `GET /v1/admin/profiles/:id` — full profile for admin (all sub-tables, gallery with signed URLs, report count, interest stats). Admin sees full PII (internal tool).
- [ ] **1.3** `POST /v1/admin/profiles/:id/moderate` — add optional `reason` on reject; send `ProfileApprovedEmail` / rejection email via React Email template.
- [ ] **1.4** `DELETE /v1/admin/profiles/:id` — hard delete profile + cascade (or soft-delete per DPDP — document choice).
- [ ] **1.5** `PATCH /v1/admin/profiles/:id/verified` — `{ isVerified: boolean }` toggles verification badge.
- [ ] **1.6** `GET /v1/admin/interests` — paginated activity: sender, receiver, status, message, createdAt. Query: `senderId`, `status`, `since`.
- [ ] **1.7** `GET /v1/admin/interests/abuse` — users who sent >10 interests today (configurable threshold).
- [ ] **1.8** Extend `ResolveReportSchema` — actions: `warn`, `suspend`, `ban`, `dismiss`. Implement in `resolveReport()` + notify reporter email.
- [ ] **1.9** Flag profiles with `openReportCount >= 3` in list responses (`isFlagged: true`).
- [ ] **1.10** `POST /v1/admin/email/broadcast` — `{ segment, subject, bodyHtml }` where segment ∈ `all|paid|free|inactive_30d`. Use Resend batch send.
- [ ] **1.11** Dashboard stats — extend `getAnalyticsDashboard()`: `activeProfiles`, `interestsSentToday`, `signupsToday`, `interestToMatchRate`, `paidConversionRate`.
- [ ] **1.12** `GET /v1/admin/analytics/signups?days=30` — `[{ date, count }]` for chart.
- [ ] **1.13** Role middleware — `requireAdminRole('super_admin')` on: tier patch, plans CRUD, revenue, email broadcast, admin CRUD.
- [ ] **1.14** Admin user CRUD (super_admin only): `GET/POST/PATCH/DELETE /v1/admin/admins`.

### Phase 2 — Database (if missing)

- [ ] **2.1** Add `success_stories` table if not present:
  - `id`, `profileId`, `testimonial`, `photoR2Key?`, `status` (pending|published|unpublished), `publishedAt`, `createdAt`
- [ ] **2.2** Add `admin_action_logs` (optional but recommended): audit trail for moderate/ban/broadcast actions.
- [ ] **2.3** Migration + seed one sample success story for UI dev.

### Phase 3 — Admin UI: new & enhanced pages

- [ ] **3.1 Dashboard** (`page.tsx`) — add missing stat cards + simple CSS/SVG bar chart for 30-day signups. Link to analytics section.
- [ ] **3.2 All Profiles** — either extend `/profiles` with tabs (Pending | All) or new `/profiles/all`. Filter bar + table + full drawer using `GET /admin/profiles/:id`.
- [ ] **3.3 Profile detail drawer** — show education, occupation, family, preferences, gallery grid, verification toggle, delete with confirm.
- [ ] **3.4 Profile reject** — reason modal (mirror photos page).
- [ ] **3.5 Interests** — new `/interests` page: activity table + abuse alerts panel.
- [ ] **3.6 Reports** — add Warn / Ban / Dismiss buttons; show `isFlagged` badge; show open report count on profile rows.
- [ ] **3.7 Email Broadcast** — new `/broadcast` page: segment select, subject, rich text or HTML textarea, preview, confirm modal. Super admin only.
- [ ] **3.8 Success Stories** — new `/success-stories` page: pending queue, publish/unpublish, preview card.
- [ ] **3.9 Revenue** — add filter: active / expired / all subscriptions.
- [ ] **3.10 Admin Users** — new `/admins` page (super_admin): list, invite by email, set role, deactivate.
- [ ] **3.11 Navigation** — update `AdminLayout.tsx` NAV_ITEMS; hide restricted routes for moderator. Show role badge in topbar.
- [ ] **3.12 Auth guard** — redirect moderator away from super_admin routes client-side + handle 403 from API.

### Phase 4 — Polish & verification

- [ ] **4.1** Types in `apps/admin/src/lib/types.ts` match all new API shapes.
- [ ] **4.2** Empty states, loading, error toasts on every new page.
- [ ] **4.3** Fix Jest if blocking admin tests (`clearMocksOnScope` — align jest / @types/jest versions).
- [ ] **4.4** Add backend tests for new admin endpoints (at minimum: role guard, broadcast segment query, report outcomes).
- [ ] **4.5** Manual test checklist (below) all pass.

---

## Manual Test Checklist (must pass before calling 100%)

1. Moderator login → sees Profiles, Photos, Reports, Interests, Dashboard only.
2. Super admin login → sees all nav items including Revenue, Plans, Broadcast, Admins.
3. Approve pending profile → member receives email.
4. Reject with reason → member receives email with reason.
5. Toggle verified badge → reflected on profile list.
6. Delete profile → removed from search/list.
7. Resolve report with Ban → user status = Suspended/Deleted, reporter gets email.
8. Profile with 3+ open reports shows flagged badge.
9. Interest abuse panel shows high-volume senders.
10. Email broadcast to `free` segment → Resend logs show sends (test mode OK).
11. Publish success story → status changes, appears in published list.
12. Dashboard charts render with real DB data.
13. Cursor pagination works on all new list endpoints.

---

## Out of Scope (do not build in this effort)

- Push notification changes (already exists — keep as super_admin optional nav item).
- Public web homepage success stories widget (stub API only).
- Mobile app success story submission flow (admin CRUD is enough for now).
- Render/Netlify deployment.

---

## File touch list (expected)

**Backend:** `admin.routes.ts`, `admin.service.ts`, `admin.schema.ts`, `schema.prisma`, new migration, possibly `packages/email-templates/src/AdminBroadcastEmail.tsx`, `ReportOutcomeEmail.tsx`

**Admin UI:** new pages under `apps/admin/src/app/(admin)/`, update `AdminLayout.tsx`, `types.ts`, `api.ts`, `globals.css` (chart styles)

---

*Created: June 2026 — handoff document for independent agent session*
