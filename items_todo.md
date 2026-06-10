# Gahoi Sarthi — Pending Items

Items that need founder input or replacement before production. Placeholders are in code until updated.

---

## Contact & support (replace placeholders)

| Item | Current placeholder | Action required |
|------|---------------------|-----------------|
| Helpline phone | `+91 98765 43210` | Replace with real helpline number (Tue–Sun 11AM–5PM) |
| Support email | `support-placeholder@gahoisarthi.in` | Replace with `support@gahoisarthi.in` (or final inbox) |
| `noreply` sender | `noreply@gahoisarthi.in` in `.env.example` | Verify domain + SPF/DKIM/DMARC in Resend before OTP goes live |

**Where placeholders should appear once wired:** Settings screen, hamburger drawer (Helpline subtitle), About page, Contact Us mailto.

---

## Gotra master list

- [ ] Founder to provide authoritative Gahoi gotra seed list
- [ ] Update `apps/backend/prisma/seed/gotras.ts` and re-run seed
- Current seed uses generic placeholder gotras (not community-verified)

---

## Legal & policies

- [ ] Privacy Policy (EN + HI) — DPDP Act 2023 compliant
- [ ] Terms of Service (EN + HI)
- [ ] Refund Policy (EN + HI)
- [ ] Link from Settings → Legal section (web + mobile)

---

## Pricing & payments

- [ ] Confirm final paid plan prices (PRD suggests ₹999 / ₹2,499 / ₹5,999)
- [ ] Razorpay live keys + webhook secret for production
- [ ] Test full payment → webhook → tier upgrade on staging

---

## Infrastructure (when moving beyond local dev)

- [ ] Render Starter plan before public traffic (free tier spins down after 15 min)
- [ ] DNS: `gahoisarthi.in`, `admin.gahoisarthi.in`, `api.gahoisarthi.in`
- [ ] Cloudflare R2 bucket + credentials for photo uploads
- [ ] EAS production builds (iOS TestFlight / Android Play)

---

## Community partnership

- [ ] Identify 2–3 Gahoi Samaj organisations for launch endorsement
- [ ] Partner logos + quotes for homepage / About screen

---

*Last updated: June 2026 — audit session*
