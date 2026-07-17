# StudentCube — Execution Phases
### `phases.md` — do exactly one phase per session unless told otherwise

**How to use this file:** start of session → read `memory.md` to find the current phase → re-read `design.md` and `rules.md` → do that phase's Step A, verify, do that phase's Step B, verify → write the `memory.md` entry → stop. Do not start the next phase in the same session unless the owner asks you to keep going.

Every phase below has two steps, per the owner's instruction that animation is layered on *after* a phase's static UI is done — not saved for one big animation pass at the end.

- **Step A — Static:** neubrutalist restyle, no animation library involved yet.
- **Step B — Animate:** GSAP/Motion layered on top of the already-verified static result.

---

## Phase 0 — Foundation (no visible page changes yet)

**Goal:** every later phase has tokens, libraries, and the loader to build on.

- Create `src/styles/tokens.css` with the full `@theme` block from `architecture.md` §3.
- Import Google Fonts (IBM Plex Sans / Sans Condensed / Mono).
- Run `npx shadcn@latest init`.
- Install: `npm install motion gsap @gsap/react`.
- Build `Loader.tsx` per `design.md` §9 and mount it in `main.tsx`.
- Build the three base primitives: `brutal-button.tsx`, `brutal-card.tsx`, `brutal-badge.tsx` in `src/components/ui/`.
- **No page gets restyled yet** — this phase is infrastructure only, so there's very little to visually verify beyond "loader shows, then the untouched app appears underneath it."
- Flag for the owner: confirm the loader should only appear on hard reload/first load, not on every in-app route change (see `prd.md` §9, assumption 4).

**Step B (animate):** the loader itself — progress bar fill animation, per `design.md` §9.

**Definition of done:** `npm run build` clean. Loader visible, resolves into the *unchanged* current site. Tokens available as Tailwind utilities (spot check with a throwaway `bg-signal-orange` on any element, then remove it).

---

## Phase 1 — Global chrome: Navbar & Footer

**Files:** `Navbar.tsx`, `Footer.tsx`, `FooterMin.tsx`

**Step A:** Restyle per `design.md` §5 (Nav bar spec). Every existing link (Home/Buy/Sell/Chat/Ambassador, footer category links, social icons, contact info) keeps its exact destination. Logo restyled, not removed or relinked.

**Step B:** Subtle entrance (nav fades/slides in once on first load — tie into the loader's resolve), link hover states get the press-effect treatment from `design.md` §4.

**Definition of done:** every nav/footer link click-tested against the pre-redesign destinations.

---

## Phase 2 — Homepage Hero

**Files:** `HeroSection.tsx`

**Step A:**
- Remove the center circular logo graphic and the six floating supply icons (calculator, book, ruler/set-square, pens, lab coat, drafting tool), per the owner's explicit instruction.
- Restyle headline ("Buy & Sell College / Accessories Safely"), the "Trusted by many college students" eyebrow badge, subhead, and the `StudentCube` inline callout using the new type scale.
- Restyle "Start Shopping" / "Sell Your Items" buttons as primary/secondary `.brutal-block` buttons — same click targets.
- Rebuild the stat bar (0% Hidden Charges / <1 Min / ~50% Average Savings / 100% Verified Students) as four `.brutal-block` chips.
- Resolve the empty center space per `design.md` §8 (negative space or a flat color block) — log which was chosen in `memory.md`.
- Remove the teal gradient background in favor of `--paper` or `--paper-blue`.

**Step B:** Stat bar count-up on scroll-into-view (GSAP + `useGSAP`), headline entrance stagger, button hover/press states.

**Definition of done:** no illustrated/floating imagery remains in the hero; both CTAs still route correctly; stat bar animates once per view, not on every scroll pass.

---

## Phase 3 — Homepage content sections

**Files:** `BrowseCategories.tsx`, `HomeFeaturedSection.tsx`, `RecentViewedSection.tsx`, `JoinCommunity.tsx`

**Step A:**
- `BrowseCategories.tsx`: rebuild category tiles as flat-color icon chips per `design.md` §5, colors rotating through the accent palette. This directly covers the "recolor the category icons" requirement.
- `HomeFeaturedSection.tsx` / `RecentViewedSection.tsx`: rebuild product cards with `brutal-card`, apply the stamped condition badges (`design.md` §6) to the existing GOOD/LIKE NEW/TOP VIEWED tags, prices set in `font-mono`.
- `JoinCommunity.tsx`: restyle the blue CTA banner and the WhatsApp button — same link target, `--campus-green` fill instead of the current blue/green combo, per `design.md` token table.

**Step B:** Category grid and product grid stagger-in on scroll; card hover lift; "View All" link micro-interaction.

**Definition of done:** all category tiles still link to the same filtered view; all product cards still link to the same product detail pages; WhatsApp button still opens the same group link.

---

## Phase 4 — Browse & product detail

**Files:** `BrowseProducts.tsx`, `ProductDetail.tsx`, `SafetyBanner.tsx` (if rendered on these pages)

**Step A:** Filter/sort controls, product grid, and product detail layout restyled — reuse the `brutal-card`/`brutal-badge` components from Phase 3 rather than rebuilding them.

**Step B:** Filter panel open/close transition (Motion), image gallery interaction if present, "Contact Seller"/"Make Offer" button press states.

**Definition of done:** filtering/sorting still functions identically; product detail still links back to browse correctly.

---

## Phase 5 — Sell flow & auth entry points

**Files:** `Sell.tsx`, `GetStarted.tsx`, `ForgotPasswordModal.tsx`

**Step A:** Form inputs restyled per `design.md` §5 (input spec) — this phase needs the most care around focus states, since it's the most form-heavy phase. Multi-step flows (if `Sell.tsx` has them) keep their exact step logic.

**Step B:** `ForgotPasswordModal.tsx` open/close via Motion's `AnimatePresence`; form field focus/validation-error states get a quick shake or color-flash tied to `--stamp-red`.

**Definition of done:** form submission still hits the same handlers; validation logic untouched; modal still opens/closes from the same triggers.

---

## Phase 6 — Chat & Profile

**Files:** `Chat.tsx`, `Profile.tsx`

**Step A:** Restyle message bubbles, conversation list, and profile layout. `RealtimeBridge.tsx` itself is not touched — only the components that render what it delivers.

**Step B:** New-message entrance animation, typing-indicator styling if present, profile stat chips (reuse the `design.md` §4 chip pattern from the homepage stat bar).

**Definition of done:** WebSocket-driven updates still render correctly; no change to how/when messages are fetched or sent.

---

## Phase 7 — Admin & Ambassador panels

**Files:** `AdminDashboard.tsx`, `AdminAmbassadorsPanel.tsx`, `AdminPaymentPanel.tsx`, `AdminReviewPanel.tsx`, `AmbassadorDashboard.tsx`

**Step A:** These are data-dense, table-heavy screens — prioritize scanability over decoration. Tables get `--ink` row dividers instead of soft grey ones; action buttons (approve/reject/refund) use the primary/secondary/destructive button spec from `design.md` §5. This is the phase where restraint matters most — resist adding the stamp signature element here, it's a working screen, not a marketing one.

**Step B:** Row-level hover state only; skip elaborate entrance animation on data tables — it slows down an admin's actual workflow.

**Definition of done:** every admin/ambassador action (approve, reject, refund, edit) still calls the same handler; route guards (`AdminRoute.tsx`/`AmbassadorRoute.tsx`) untouched and still enforced.

---

## Phase 8 — Legal & static pages

**Files:** `PrivacyPolicy.tsx`, `TermsOfService.tsx`, `CancellationRefund.tsx`, `ShippingExchange.tsx`

**Step A:** Typography and layout only — heading styles, body text, maybe a `brutal-block` container around the content well. These pages prioritize readability; do not apply heavy decoration or the stamp motif here.

**Step B:** None beyond the sitewide nav/footer animation already shipped in Phase 1. These pages don't need their own motion pass.

**Definition of done:** full legal text content unchanged, only presentation.

---

## Phase 9 — Sitewide QA & polish

**Not a new visual phase — a verification pass across everything shipped in Phases 0–8.**

- Full click-through of every nav link, footer link, button, and logo against a pre-redesign list.
- Responsive check at common breakpoints (mobile/tablet/desktop) for every touched page.
- `prefers-reduced-motion` check across all animated components.
- Confirm `--radius` was applied consistently if the Phase 2 fallback (4px) was ever invoked — no mixed sharp/rounded corners across pages.
- Lighthouse or equivalent quick performance pass — flag (don't silently fix) anything that looks like it regressed from the animation libraries.
- Final `memory.md` entry marking the redesign complete, with a summary of every deviation from this doc set and why.
