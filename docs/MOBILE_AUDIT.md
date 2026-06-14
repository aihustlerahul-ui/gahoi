# Mobile App — Design & Functionality Audit + Remediation Plan

**Date:** 2026-06-13
**Scope:** `apps/mobile` reviewed against `docs/GahoiSarthi_DesignSpec_v1.docx` (v1.0, all 9 screens locked).
**Branch:** `mobile/design-spec-remediation`

---

## Summary

The implemented mobile app and the locked design spec are **visually two different apps**. The code ships a dark brown/gold theme; the spec mandates a light ivory/gold theme and explicitly lists dark theme as "intentionally NOT copied" (spec §13.3). Core flows work functionally (auth, wizard, matches, interests, shortlist, kundli, profile detail), but the visual system, ~half the navigation surfaces, and several spec'd features are missing.

**Root cause:** there is no shared theme/token layer — every screen hardcodes off-palette dark colors and serif fonts. Fixing the theme is the highest-leverage first move because it touches every file.

---

## Findings

### A. Look & feel (every screen)
- **A1 — Theme inverted (CRITICAL).** App uses dark bg `#1A0800`, cards `#2C1A10`, borders `#3D281C`. Spec: Ivory `#FDFAF5` bg, white cards, `#E8E0D0` borders, dark-brown text `#3D2E1A`. Dark theme explicitly rejected (§13.3).
- **A2 — Wrong primary gold.** Code uses `#E8B84B` (Gold Accent, badge-only) as CTA color. Spec CTA = Sacred Gold `#B5620E`.
- **A3 — Typography.** Code uses `Georgia`/`serif` + 22–36px headings + 700/800 weights. Spec: Arial / Noto Sans Devanagari, 9–16px, 400/500. Noto Sans Devanagari not bundled (no `expo-font`).
- **A4 — Icons.** Code uses Ionicons. Spec: Tabler Icons, outline only.
- **A5 — Semantic colors.** Verified should be `#1A7A45`; danger `#C0392B`; Manglik `#7B2D8B`. Code uses `#4CAF50`/`#FF6F61`/`#F44336`. Pill radius should be 20px.

### B. Navigation architecture
- **B1 — Tab bar wrong.** Spec: Home · Search · Interests (centre elevated FAB) · Alerts · Profile. Code: Matches · Interests · Shortlist · Settings. Missing Search, Alerts, Profile tabs and the centre FAB.
- **B2 — No hamburger drawer (Screen 7).** Entirely absent.
- **B3 — No own-profile screen (Screen 3).** No stats cards, edit pencils, subscription banner, gallery.
- **B4 — No real Search screen.** Reduced to a profile-ID lookup inside Settings. No name/profession/state search, no advanced filters.
- **B5 — No Alerts inbox.** Push registers but no in-app screen.

### C. Screen feature gaps
- **C1 — Splash (1):** no mandala animation, no tagline, serif not Consolas, no transition.
- **C2 — Registration/OTP (1):** missing "Profile created by" chips, T&C checkbox, Google sign-in, honeypot. OTP is one field (not 6 boxes); no resend countdown, no attempts warning, no lockout screen.
- **C3 — Wizard (2):** **Step 5 "Photos" missing entirely** (R2 presigned upload, per-photo visibility, moderation). No 500-char About counter.
- **C4 — Match Feed (5):** no header bar, no category filter pills, Top Pick is just `list[0]` (not paid-gated), match card layout wrong (no full-bleed photo, gotra/profession pills, verified/active badge, share button), no free/paid daily limits.
- **C5 — Interests (6):** Views tab missing (moved to Settings), no free-tier blur/limit, no status banners, no match celebration, Accepted tab doesn't show contact inline.
- **C6 — Profile detail – other (4):** gates on binary `isPremium`, but spec/CLAUDE.md require **three-tier visibility** (free → masked → full). No masked format (`9*******4`) for paid-no-match tier.
- **C7 — Settings (8):** missing dark-theme toggle, hide-profile toggle, notification toggles, change password, legal links + version, helpline dialler, contact us.

### D. i18n
- **D1 — Device locale detect stubbed.** `getDeviceLanguage()` hard-returns `'en'`; `expo-localization` unused.
- **D2 — Screens don't consume i18n.** `index`/`interests`/`shortlist`/`login`/`wizard` hardcode `"English / हिन्दी"` inline, so the language toggle barely changes the UI. Locale JSON files exist but go mostly unused. Spec convention: section headers in selected language only; field labels both.

---

## Remediation task list — status

Branch: `mobile/design-spec-remediation`. Typecheck green after every task.
The **entire app is now on the light ivory/gold theme** (no dark screens remain except the splash, which is dark by spec §4.1).

### Phase 0 — Foundation
- [x] **M1 — Theme & token system.** `src/theme/index.ts` (colors/spacing/radius/typography, full spec palette, system sans-serif). Shared primitives: `src/components/ui/` — `Icon` (Tabler→Ionicons-outline map), `Button`, `Screen`/`Card`/`Pill`. Fixed a pre-existing `OptionPicker` generic bug.

### Phase 1 — Re-skin existing screens
- [x] **M2 — Splash + Login/OTP.** Splash tagline added; Login fully light with 6-box auto-advance OTP, resend countdown, attempts warning, "created by" chips, T&C checkbox, honeypot, Google placeholder.
- [~] **M3 — Wizard.** Re-skinned to light. **PENDING:** Photos step (needs `expo-image-picker` + R2 presigned upload) and About 500-char counter.
- [x] **M4 — Match Feed.** Light; header bar (Namaste + search/menu), category pills, redesigned match card (full-bleed photo, gotra/profession pills, verified badge, ID overlay), paid-gated Top Pick.
- [x] **M5 — Interests + Shortlist.** Light; added Views tab (4 tabs), status banners, contact CTA on Accepted. **PENDING:** free-tier blur/limit, match celebration.
- [~] **M6 — Profile detail (other).** Re-skinned to light. **PENDING:** three-tier masking — still a binary `isPremium` gate; needs `@gahoisarthi/shared` masking + backend serializer tiers (free→masked→full).
- [~] **M7 — Settings.** Re-skinned to light. **PENDING:** dark-theme toggle, hide-profile toggle, notification toggles, change password, legal links + version, helpline dialler, contact us.

### Phase 2 — New navigation surfaces
- [x] **M8 — 5-tab bar + elevated Interests FAB** (`(tabs)/_layout.tsx`); Shortlist/Settings now `href:null` (reached via drawer/links).
- [x] **M9 — Hamburger drawer** (`app/drawer.tsx`) — dark header + 4 groups + helpline dialler.
- [x] **M10 — Search screen** (`(tabs)/search.tsx`) — quick find, by-ID lookup, by-name. **PENDING:** advanced filter set + confirm `/profile/search` contract.
- [x] **M11 — Own profile screen** (`(tabs)/profile.tsx`) — hero, stat chips, edit/links.
- [x] **M12 — Alerts inbox** (`(tabs)/alerts.tsx`) — needs `/profile/me/notifications` endpoint (graceful empty if absent).

### Phase 3 — i18n
- [ ] **M13 — Device-locale detection (`expo-localization`) + migrate hardcoded `"EN / हि"` strings to i18n keys.**

### Follow-ups (deferred)
- [ ] Bundle Noto Sans Devanagari + real Tabler icon set (network install). Swap point: `src/theme` font + `src/components/ui/Icon.tsx`.
- [ ] Splash mandala SVG animation (`react-native-svg`).
- [ ] Drawer as true slide-in overlay (currently a pushed route).
- [ ] Verify `payment/checkout` Razorpay flow against spec.
- [ ] Pre-existing lint errors in `src/lib/api.ts` + `src/lib/auth.tsx` (no-empty / no-useless-catch) — unrelated to this work.
</content>
</invoke>
