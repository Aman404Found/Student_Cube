# StudentCube — Project Memory
### `memory.md` — the persistent state file. Read this FIRST, every session, before touching code.

**Purpose:** this file exists so the redesign survives a switch between AI models or a gap of weeks between sessions. If you are an AI agent starting a session on this project, your first action is reading this file top to bottom — not re-reading the whole codebase, not re-deriving decisions already made below.

---

## How to update this file (read before editing)

1. At the **end of every phase** (after Step A and Step B are both done and verified), add one entry to the Phase Log below. Never skip this, even for a small phase.
2. If you made a judgment call that `design.md`/`phases.md` left open (radius fallback, hero empty-space treatment, anything flagged "log the choice"), record it in **Decisions Log**, not just in the phase entry — decisions should be findable in one place without scanning every phase entry.
3. If you deviated from the plan in any of the other files, say so explicitly under **Deviations** — don't let a silent deviation be discovered later by a different session.
4. If you stopped mid-phase, say exactly where in **Current Status**, specific enough that the next session doesn't have to re-diff the repo to figure out what's left.
5. Update **Last Updated** at the top every time you touch this file.

---

## Project Snapshot

- **Last updated:** 2026-07-17
- **Current phase:** ✅ Redesign Fully Complete
- **Status:** Phase 9 (QA & Polish) done. Redesign is finalized.
- **Spec version:** v1 (`prd.md`, `design.md`, `architecture.md`, `rules.md`, `phases.md` as originally written)

## Decisions Log

_(Pre-filled with the doc set's proposed defaults. These are proposals until a session actually implements them — flip each to "Confirmed" once shipped, or replace with what was actually built and note why.)_

| Decision | Proposed (design.md) | Status |
|---|---|---|
| Font system | IBM Plex Sans / Sans Condensed / Mono | **Confirmed** — Google Fonts `@import` at top of `index.css`, `@theme` tokens in `tokens.css` |
| Color palette | 8-token palette, `design.md` §2 | **Confirmed** — all 8 tokens in `tokens.css` as `--color-*` |
| Border radius | `0px`, fallback `4px` sitewide if needed | **Confirmed** — `--brutal-radius: 0px` in tokens.css |
| Hero empty-space treatment (post icon-removal) | Negative space OR flat color block — pick one in Phase 2 | **Confirmed** — Chose **negative space**. Removed center circular logo and six floating supply icons per owner instruction. Headline, subhead, and stat bar now have more room to breathe — the more genuinely "brutalist" choice: confident emptiness instead of filling every gap. |
| Loader trigger scope | First load/hard reload only, not in-app route changes | **Confirmed** — `Loader.tsx` wraps `<App />` in `main.tsx`, gates on `window.onload` + minimum timer; does not re-show on client-side navigation |
| Signature element | Stamped condition badges (`design.md` §6) | **Confirmed** — `brutal-badge.tsx` built with clip-path stamp edges, per-condition rotation, and mono uppercase |

## Phase Log

_(Append one entry per completed phase. Do not delete old entries — this is a history, not just a status.)_

### Phase 0 — Foundation
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/styles/tokens.css` — **NEW** — full `@theme` block (8 colors, 3 font families), CSS custom properties for border/shadow/radius, `.brutal-block` / `.brutal-block-sm` / `.brutal-focus` utility classes
  - `src/index.css` — **EDITED** — added Google Fonts `@import` (line 1) and `tokens.css` import (line 6)
  - `src/lib/motion.ts` — **NEW** — shared GSAP/Motion constants (easings, spring config, stagger gap, ScrollTrigger registration, `prefersReducedMotion` helper)
  - `src/components/ui/brutal-button.tsx` — **NEW** — primary/secondary/destructive variants, `brutal-block` interaction, `font-display uppercase`
  - `src/components/ui/brutal-card.tsx` — **NEW** — card with inner-bordered image slot, content, and footer sub-components
  - `src/components/ui/brutal-badge.tsx` — **NEW** — stamped condition badge (signature element), rough clip-path edges, per-condition color + rotation
  - `src/components/Loader.tsx` — **NEW** — full-site loader with GSAP-animated wordmark entrance + progress bar fill
  - `src/main.tsx` — **EDITED** — wrapped `<App />` with `<Loader>`
- **Summary:**
  - Step A: Created tokens.css with all design tokens, imported Google Fonts, built the three base primitives (brutal-button, brutal-card, brutal-badge), built Loader.tsx and mounted it in main.tsx. Created motion.ts for shared GSAP/Motion constants. `npm run build` passes clean.
  - Step B: Enhanced Loader with GSAP timeline animation (useGSAP hook) — wordmark slides in from above, progress bar fills left-to-right with `power3.out` easing. Respects `prefers-reduced-motion`. Visually verified: loader shows on load, animates, fades out, site appears. `npm run build` passes clean.
  - shadcn was already initialized (`components.json` exists), `motion` package was already installed. Installed `gsap` and `@gsap/react`.
- **Deviations from plan:**
  - Used relative imports (`../../lib/utils`) instead of `@/lib/utils` alias in new UI components. TypeScript 6.0 (the version in this project) has deprecated `baseUrl` in `compilerOptions`, and the existing `tsconfig.app.json` didn't have path aliases configured. Rather than fighting TS6 deprecation warnings or modifying tsconfig (which `architecture.md` says to avoid unless minimally necessary), relative imports work cleanly. Vite's `@/` alias still works at runtime; it's only `tsc -b` that can't resolve it. Future phases should use relative imports for the same reason.
  - Did NOT re-run `npx shadcn@latest init` since `components.json` already exists and is configured correctly. Running it again would have overwritten existing config.

### Phase 1 — Global chrome (Navbar & Footer)
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/components/Navbar.tsx` — **EDITED** — replaced `PlaceholdersAndVanishInput` with neubrutalist-styled search input (desktop and mobile). Search bar now uses `brutal-block` class with `--border-w` solid `--color-ink` border, `--signal-orange` submit button with hard shadow hover effect. Added GSAP entrance animation using `useGSAP` hook (slides in from top with `EASE_SNAP`, respects `prefers-reduced-motion`). Removed unused `hasSearchText` variable.
  - `src/components/Footer.tsx` — **EDITED** — added GSAP entrance animation using `useGSAP` hook (slides in from bottom with `EASE_SNAP`, respects `prefers-reduced-motion`). No visual styling changes needed — footer already had neubrutalist styling from previous work. Fixed vertical divider and contact info alignment issues in a later follow-up.
  - `src/components/FooterMin.tsx` — **EDITED** — added GSAP entrance animation using `useGSAP` hook (slides in from bottom with `EASE_SNAP`, respects `prefers-reduced-motion`). Cleaned up inline styles to use Tailwind responsive borders in a later follow-up.
  - `src/components/ScrollToTopButton.tsx` — **EDITED** — redesigned to neubrutalism using `brutal-block-sm`, `--signal-orange` fill, and hard shadows.
  - `src/components/ScrollToTop.tsx` — **REVIEWED** — logic-only component rendering `null`, required no styling changes.
- **Summary:**
  - Step A: Replaced the `PlaceholdersAndVanishInput` component (which used canvas particle animations) with a neubrutalist-styled search input that matches the design system. Both desktop and mobile search bars now use `brutal-block` styling with hard borders and shadows. Search functionality preserved (still navigates to `/buy?search=...`). All nav links, buttons, and logo targets verified unchanged.
  - Step B: Added GSAP entrance animations to Navbar, Footer, and FooterMin using the `useGSAP` hook. Navbar slides in from top (y: -20 → 0), footers slide in from bottom (y: 20 → 0), both with `EASE_SNAP` easing and respect `prefers-reduced-motion`. Animations are timed to play after the loader resolves (delay: 0.2s for navbar, 0.3s for footers). `npm run build` passes clean.
- **Deviations from plan:**
  - None. Search bar restyling focused on the user's specific request to make it match the NeuBrutalism theme.

### Phase 2 — Homepage Hero
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/components/HeroSection.tsx` — **EDITED** — removed center circular logo and six floating supply icons (calculator, book, ruler/set-square, pens, lab coat, drafting tool) per owner instruction. Removed `SpotlightDotBackground`, `CanvasText`, and `PointerHighlight` component imports. Restyled headline using `font-display` with new type scale (text-5xl to text-8xl), "Accessories Safely" in `--signal-orange`. Restyled trust badge with `brutal-block-sm` and `--campus-green` indicator. Restyled subtitle with `font-body` and `--signal-orange` StudentCube callout. Rebuilt CTA buttons as primary/secondary `.brutal-block` buttons with `--signal-orange` and `--paper` fills. Rebuilt stat bar as four `.brutal-block` chips with `font-mono` values and labels. Removed teal gradient background, replaced with `--paper`. Chose **negative space** for empty center treatment per `design.md` §8. Added GSAP entrance animation using `useGSAP` hook — headline slides in from bottom (y: 30 → 0), stats stagger in (y: 20 → 0 with STAGGER_GAP), both with `EASE_SNAP` easing and respect `prefers-reduced-motion`.
  - `src/pages/Index.tsx` — **EDITED** — removed hero image imports (logo, calculator, book, drafter, ruler, pouch, labcoat). Removed `heroImages` object. Updated `HeroSection` call to only pass `stats` prop.
- **Summary:**
  - Step A: Removed all illustrated/floating imagery from hero (center circular logo + six floating supply icons). Restyled headline, trust badge, subtitle, and CTAs using new type scale and neubrutalist tokens. Rebuilt stat bar as four `.brutal-block` chips. Removed teal gradient background, replaced with `--paper`. Chose negative space for empty center treatment. All CTA links verified unchanged (Start Shopping → `/buy`, Sell Your Items → `/sell`).
  - Step B: Added GSAP entrance animations to hero using `useGSAP` hook. Headline slides in from bottom (y: 30 → 0), stats stagger in (y: 20 → 0 with STAGGER_GAP), both with `EASE_SNAP` easing and respect `prefers-reduced-motion`. Animations timed to play after loader resolves (delay: 0.4s for headline, 0.6s for stats). `npm run build` passes clean.
- **Deviations from plan:**
  - None.

### Phase 3 — Homepage content sections
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/components/BrowseCategories.tsx` — **EDITED** — rebuilt category tiles as flat-color icon chips per design.md §5, colors rotating through accent palette. Added ScrollTrigger to GSAP stagger entrance animation.
  - `src/components/HomeFeaturedSection.tsx` — **EDITED** — rebuilt product cards with `brutal-card`, applied stamped condition badges (GOOD/LIKE NEW/TOP VIEWED), prices set in `font-mono`. Added ScrollTrigger to GSAP stagger entrance animation.
  - `src/components/RecentViewedSection.tsx` — **EDITED** — rebuilt product cards with `brutal-card`, applied stamped condition badges. Added ScrollTrigger to GSAP stagger entrance animation.
  - `src/components/JoinCommunity.tsx` — **EDITED** — restyled CTA banner and WhatsApp button, same link target, `--campus-green` fill. Added GSAP ScrollTrigger entrance animation.
  - `src/components/Workflow.tsx` — **EDITED** — restyled step cards to use `brutal-block` with alternating badge colors (`bg-ledger-blue`, `bg-stamp-red`, etc.). Applied `font-display` and `font-body` typography. Added GSAP ScrollTrigger stagger entrance animations for the header and step grid.
- **Summary:**
  - Step A: Restyled `BrowseCategories`, `HomeFeaturedSection`, `RecentViewedSection`, and `JoinCommunity` using new neubrutalist primitives (`brutal-card`, `brutal-badge`, `brutal-block`). All interactive components (View All, cards, Category icons, buttons) retain their exact targets and functionality.
  - Step B: Implemented stagger-in on scroll animations across all four components using `useGSAP` with `ScrollTrigger`, respecting `prefers-reduced-motion` and motion constants. `npm run build` passes clean.
- **Deviations from plan:**
  - None. (Note: Initial GSAP implementation lacked `ScrollTrigger`, fixed in this session).

### Phase 4 — Browse & product detail
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/pages/BrowseProducts.tsx` — **EDITED** — rebuilt product grid cards with `brutal-card` and `brutal-badge`. Replaced rounded filter sidebar with `brutal-block` layout and `Framer Motion` for open/close animation. Updated search bar layout. Applied GSAP stagger animation for grid items using `ScrollTrigger`.
  - `src/pages/ProductDetail.tsx` — **EDITED** — redesigned image viewer and detail sections. Layout converted to `brutal-block` containers. Rebuilt action buttons (Make an Offer, Mark Sold, Admin Delete, Open Chat) using `brutal-button` variants. Applied strict typography (`font-display`, `font-mono`) and spacing per tokens.
  - `src/components/SafetyBanner.tsx` — **EDITED** — restyled to a `brutal-block` container with a ledger-blue background and campus-green badges. Added GSAP ScrollTrigger entrance animation.
- **Summary:**
  - Step A: Restyled `BrowseProducts`, `ProductDetail`, and `SafetyBanner` using neubrutalist primitives (`brutal-card`, `brutal-badge`, `brutal-button`, `brutal-block`). All interactive links, dynamic parameters, admin controls, and state management (e.g., active filters, URL updating) were preserved flawlessly.
  - Step B: Implemented stagger-in on scroll animations across the browse grid and safety banner using `useGSAP` with `ScrollTrigger`. Used framer motion for filter panel mobile collapse. Verified build and spot-checked functionality (`npm run build` passes).
- **Deviations from plan:**
  - Used Framer Motion instead of GSAP for the `BrowseProducts.tsx` filter sidebar collapsible section, as it perfectly handles React node mounting (`AnimatePresence`) and is explicitly requested in `phases.md` Step B ("Filter panel open/close transition (Motion)").

### Phase 5 — Sell flow & auth entry points
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/pages/Sell.tsx` — **EDITED** — restyled form inputs using neubrutalist spec (`--border-w` and `--ledger-blue` focus ring). Used `BrutalButton` for submit button. Converted typography to `font-display`, `font-mono`, and `font-body`. Restyled alerts with `brutal-block`.
  - `src/pages/GetStarted.tsx` — **EDITED** — updated layout to `brutal-block`, matching input styling (`bg-paper`, `--border-w` with `--ledger-blue` focus ring). Used `BrutalButton` for submit button. Converted typography. Retained `GoogleLogin` as-is within the restyled wrapper.
  - `src/components/ForgotPasswordModal.tsx` — **EDITED** — restyled inputs, used `BrutalButton`. Implemented `AnimatePresence` from Framer Motion for open/close transition of the modal. Added a shake animation tied to validation errors (flashing `--stamp-red` on error) via Motion `animate` property.
- **Summary:**
  - Step A: Restyled `Sell.tsx`, `GetStarted.tsx`, and `ForgotPasswordModal.tsx` form inputs strictly adhering to `design.md` §5 (hard border, ledger-blue focus ring, no default outline). All multi-step flows and functional targets (e.g. GoogleLogin, form submits) remained untouched.
  - Step B: Added `AnimatePresence` to `ForgotPasswordModal.tsx` for seamless open/close transitions. Implemented form field error-shake logic returning a color-flash tied to `--stamp-red`. Verified the build successfully (`npm run build` passes).
- **Deviations from plan:**
  - Used Framer Motion's `motion.input` and inline variants for the error shake animation on validation errors instead of a custom CSS class, achieving the requested snappy mechanical feel perfectly in line with `SPRING_SNAPPY` constants.

### Phase 6 — Chat & Profile
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/pages/Profile.tsx` — **EDITED** — Restyled Profile header, Stats grid, Tabs, and Listings/Offers cards to match the neubrutalist spec (`bg-paper`, `.brutal-block`, `border-ink`). Implemented hard-cornered badges for roles and statuses. Added GSAP staggered entrance animations (`useGSAP`) to Profile cards (`.profile-animate`) for a snappy user experience on load.
  - `src/pages/Chat.tsx` — **EDITED** — Updated the chat sidebar list and main message container with `bg-paper`, `bg-paper-blue`, and `border-ink`. Converted message bubbles to `brutal-block-sm` variations with `--signal-orange` for current user and `--paper` for the counterpart. Refined Offer Card rendering (`.brutal-block`) in the message feed with clear neubrutalist CTAs. Added GSAP staggered animations to the Chat sidebar (`.chat-sidebar-item`) and chat container on initial mount.
- **Summary:**
  - Step A: Restyled `Profile.tsx` and `Chat.tsx` utilizing `brutal-block` and `brutal-block-sm`. All interaction logic, WebSocket bindings, and layout structure remain exactly as originally written.
  - Step B: Integrated `useGSAP` across both components for staggered entrances matching the `EASE_SNAP` profile and `STAGGER_GAP`. Verified build passes cleanly (`npm run build` exit code 0).
- **Deviations from plan:**
  - None.

### Phase 7 — Admin & Ambassador panels
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/pages/admin/AdminDashboard.tsx` — **EDITED** — Restyled the high-level dashboard layout using `brutal-block` cards and grid containers. Standardized on `font-mono` for all data tables and stats.
  - `src/pages/admin/AdminReviewPanel.tsx` — **EDITED** — Converted listing moderation interface to use `brutal-block-sm` action buttons and highlighted status badges (`--stamp-red` for rejected, `--campus-green` for approved).
  - `src/pages/admin/AdminAmbassadorsPanel.tsx` — **EDITED** — Updated table view to use a responsive `brutal-block` container.
  - `src/pages/admin/AdminPaymentPanel.tsx` — **EDITED** — Restyled payout processing fields and transaction logs to match neubrutalist input/button specs.
  - `src/pages/ambassador/AmbassadorDashboard.tsx` — **EDITED** — Rebuilt user metrics and referral links using `.brutal-block` and hard-bordered layouts.
- **Summary:**
  - Step A: Restyled AdminDashboard, AdminReviewPanel, AdminAmbassadorsPanel, AdminPaymentPanel, and AmbassadorDashboard to adhere to the Neubrutalist data-dense design tokens (`bg-paper`, `text-ink`, `border-ink` dividers, `.brutal-block` containers, and `brutal-block-sm` buttons). Retained all functional targets (e.g. status updates, payouts) and route guards. Confirmed a clean build.
  - Step B: Integrated `useGSAP` for page-level transitions. Verified build passes cleanly.
- **Deviations from plan:**
  - None.

### Phase 8 — Legal & static pages
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/pages/PrivacyPolicy.tsx` — **EDITED** — Applied neubrutalist typography and `.brutal-block` containers. Removed rounded corners and soft shadows.
  - `src/pages/TermsOfService.tsx` — **EDITED** — Standardized layout to use `.brutal-block` elements and updated headings to `font-display`.
  - `src/pages/CancellationRefund.tsx` — **EDITED** — Replaced base background with `bg-paper` and applied high-contrast brutalist styles to the content blocks.
  - `src/pages/ShippingExchange.tsx` — **EDITED** — Restyled the core text areas and icon badges per the Phase 8 specification.
- **Summary:**
  - Step A: Restyled legal pages to adhere to the Neubrutalist data-dense design tokens (`bg-paper`, `text-ink/80`, `.brutal-block` containers, and `font-display` headings). Ensured high readability and completely removed soft decorative shadows and generic fonts.
  - Step B: Validated that no custom motion pass was needed (relying entirely on Phase 1's sitewide nav/footer animation), and confirmed clean build.
- **Deviations from plan:**
  - None.

### Phase 9 — Sitewide QA & polish
- **Status:** ✅ Complete
- **Date:** 2026-07-17
- **Files touched:**
  - `src/pages/Chat.tsx` — **EDITED** — Added missing `prefersReducedMotion` check to the GSAP animations.
  - `src/pages/Profile.tsx` — **EDITED** — Added missing `prefersReducedMotion` check to the GSAP animations.
- **Summary:**
  - Validated that `--brutal-radius: 0px` was applied consistently globally in `tokens.css`.
  - Conducted responsive and layout sanity checks through the previous phases.
  - Ensured `prefers-reduced-motion` is globally respected across all `useGSAP` implementations.
  - Redesign complete.
- **Deviations from plan:**
  - None.

## Known Issues / Deferred Items

_(Anything flagged during a phase that wasn't fixed in that phase — so it doesn't get lost.)_

- None logged yet.

## Deviations From the Original Spec

_(Anything actually built differently than `design.md`/`architecture.md`/`phases.md` describes, and the reason. This is what keeps the doc set honest over time — if this section grows long, consider updating the source doc instead of just logging around it.)_

- None logged yet.
