# StudentCube — Neubrutalism Redesign
### Product Requirements Document (PRD)

**Companion files:** `architecture.md` · `design.md` · `rules.md` · `phases.md` · `memory.md`
**Read order for an AI agent:** this file → `design.md` → `architecture.md` → `rules.md` → `phases.md` (start work) → `memory.md` (log after every phase)

---

## 1. Summary

StudentCube is a working, in-production peer-to-peer campus marketplace (React 19 + Vite + Tailwind v4 frontend, Node/Express/MongoDB backend, Razorpay payments, Cloudinary media, WebSocket chat). This project is a **presentation-layer redesign only**: restyle the entire frontend into a **Neubrutalism** design system — bold black borders, hard offset shadows, flat high-contrast color, chunky type, tactile press-states — while every existing feature keeps working exactly as it does today.

This is not a rebuild. It is a re-skin executed by an AI coding agent, in small verifiable phases, potentially across multiple sessions and even multiple AI models.

## 2. Background

The current UI (see `real.png` reference screenshot) uses a soft, glassmorphic, gradient-heavy style: rounded cards, soft shadows, a teal/blue hero gradient, and hand-illustrated supply icons (calculator, book, ruler, pens, lab coat, drafting tool) floating around a central circular logo. The owner has decided this doesn't match the brand energy they want going forward and has chosen Neubrutalism as the target direction.

## 3. Goals

1. Apply a single, consistent neubrutalist design system (defined in `design.md`) across **every** page and shared component listed in Section 7.
2. Preserve 100% of existing functionality — auth, browsing, offers, chat, payments, ambassador flow, admin panels.
3. Ship a full-site loader that resolves into the styled app once it's ready.
4. Layer in purposeful motion (GSAP + Motion) on top of the finished static design, phase by phase — never before the static UI for that phase is verified.
5. Use existing component ecosystems (shadcn/ui, MagicUI, React Bits) wherever they remove build time, instead of hand-building everything from scratch.
6. Leave a trail (`memory.md`) so a different AI model can pick up the project mid-way with zero lost context.

## 4. Non-Goals

- **No backend work of any kind.** `student_cube_backend/` is entirely out of scope — no route, controller, model, middleware, or `server.js` changes.
- No changes to API request/response shapes, auth/session/JWT logic, payment logic, or the WebSocket protocol.
- No removal, renaming, or re-targeting of any existing link, button action, redirect, or logo. Visual restyling only — the thing a link points to never changes.
- No new pages or business features.
- No content rewrites beyond what a new layout requires (e.g., a shortened label) — flag anything larger instead of silently rewriting copy.
- No introducing a CSS-in-JS system, a different component framework, or replacing Tailwind — the redesign stays inside the existing stack.

## 5. Explicit Requirements From the Owner

These were called out directly and are treated as firm requirements, not suggestions:

- Remove the center circular logo graphic **and** the surrounding floating supply icons (calculator, book, ruler/set-square, pens, lab coat, drafting tool) from `HeroSection.tsx`.
- Recolor the category icons in `BrowseCategories.tsx` to match the new neubrutalist palette.
- Beyond those two call-outs, restyle whatever else needs to change to make a section actually read as neubrutalist — the owner does not want a half-converted page.
- Adopt shadcn/ui, MagicUI, and/or React Bits where they speed up delivery — agent's discretion on which, per `architecture.md`.
- Animate each phase with GSAP and/or Motion only **after** that phase's static styling is built and verified — not before, and not all at the end.
- Add a website loader shown while the app/assets load, before the styled site is revealed.
- Never touch the backend, and never remove/redirect any existing link, button, or logo.

## 6. Non-Negotiable Constraints

| Constraint | Why |
|---|---|
| `student_cube_backend/` is read-only | Owner's explicit instruction — a visual project must not risk live functionality |
| No link/button-target/logo changes | Same reason — navigation must behave identically before and after |
| Work in the phases defined in `phases.md` | An agent cannot safely reskin ~25 files in one pass; incremental phases keep each change reviewable and revertible |
| Update `memory.md` after every phase | The owner may switch AI models mid-project; the next model must be able to resume from `memory.md` alone |
| Follow `rules.md` at all times | Guardrails apply throughout, not just at the start |

## 7. Scope — Pages & Components

### Pages (`student_cube/src/pages/`)
Index (home) · BrowseProducts · ProductDetail · Sell · Chat · Profile · GetStarted · AdminDashboard · AmbassadorDashboard · PrivacyPolicy · TermsOfService · CancellationRefund · ShippingExchange

### Shared / layout components (`student_cube/src/components/`)
Navbar · Footer · FooterMin · HeroSection · BrowseCategories · HomeFeaturedSection · RecentViewedSection · JoinCommunity · SafetyBanner · Workflow · ForgotPasswordModal · AdminAmbassadorsPanel · AdminPaymentPanel · AdminReviewPanel

### Visual primitives (`student_cube/src/components/ui/`)
Existing motion primitives (`lens`, `spotlight-bg`, `canvas-text`, etc.) — audited per phase, replaced or restyled where they conflict with the flat/hard-edged neubrutalist look (soft glow/lens effects generally don't).

### Explicitly out of visual scope (logic only — do not restyle by rewriting logic)
`AdminRoute.tsx`, `AmbassadorRoute.tsx` (route guards), `RealtimeBridge.tsx` (WebSocket bridge), `AuthContext.tsx`, `useDevToolsBlocker.tsx`, `utils/api.ts`, `utils/colleges.ts`, `utils/productImages.ts`. These may need a wrapping visual component touched around them, but their internal logic is untouched.

## 8. Success Criteria

- [ ] Every page/component in Section 7 uses the tokens and components defined in `design.md` — no page left in the old style.
- [ ] `npm run build` succeeds with zero new TypeScript errors after each phase.
- [ ] Manual click-through confirms every nav link, CTA, footer link, and logo still points to its original destination.
- [ ] Loader appears on first load and resolves into the redesigned homepage.
- [ ] Motion is present but restrained — see `design.md` §7 for the "one signature, quiet everywhere else" rule.
- [ ] `memory.md` has one dated entry per completed phase, written before that phase is considered done.

## 9. Assumptions Made in This Doc Set

Stated here so the owner can correct any of them before work starts; otherwise the agent proceeds with these defaults.

1. **Color palette and font family are proposals**, detailed with rationale in `design.md`. They're specific and considered, not placeholders — but they're the owner's to override.
2. **Border radius defaults to 0px** (true hard-edged brutalism) with an approved fallback of 4–6px if fully sharp corners feel too harsh on small mobile screens — see `design.md` §4.
3. **The Hero's empty center space** (after the graphic/icons are removed) is filled per the guidance in `design.md` §8 — this is a suggestion, not a requirement; leaving it as clean negative space is equally valid and arguably more in the spirit of the removal request.
4. **"Full-site loader"** is interpreted as a first-visit/hard-reload loader (not shown on in-app client-side route changes), since the app is a single-page app — flagged in `phases.md` Phase 0 for owner confirmation if a different behavior is wanted.
