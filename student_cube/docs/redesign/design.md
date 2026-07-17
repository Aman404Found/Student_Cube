# StudentCube — Design System
### `design.md` — the visual spec every phase in `phases.md` builds against

---

## 1. Direction, in one paragraph

Neubrutalism, grounded in what StudentCube actually is: a **campus resale marketplace** — receipts, price tags, rubber-stamped "condition" grades, drafting tools, lab coats, notebooks. Not generic "thick border + primary colors" neubrutalism — a version of it that looks like it could only be StudentCube. Boldness is spent in one place (the condition/status badges — see §6), everything else stays disciplined: flat color, hard shadow, no gradients, no blur, no soft rounded corners.

## 2. Color

Pure white background, not a tinted cream — the color-blocking and borders carry the visual weight, not the page background.

| Token | Hex | Role | Why this one |
|---|---|---|---|
| `--ink` | `#0A0A0A` | borders, shadows, primary text | The "stamped ink" of a receipt or rubber stamp |
| `--paper` | `#FFFFFF` | primary background | Keeps focus on the color-blocked content |
| `--paper-blue` | `#EEF2FC` | alternate section background | A graph-paper/blueprint tint — nods to the Drafters & Instruments / Lab Coats categories, not a decorative accident |
| `--signal-orange` | `#FF5A1F` | primary brand + CTAs | Evolved from StudentCube's existing orange — keeps brand continuity through the redesign |
| `--campus-green` | `#12B76A` | success, "Verified", WhatsApp CTA | The site already uses green for "100% Verified Students" and the WhatsApp button — kept, flattened |
| `--ledger-blue` | `#2952E3` | links, secondary accent, category chips | Ballpoint-pen ink — the color of a student's own notes |
| `--highlighter` | `#FFD400` | hover fills, "Top Viewed" tag, active states | An actual highlighter pen, not "neubrutalism yellow because that's the trope" |
| `--stamp-red` | `#FF3B5C` | hot deals, errors, destructive actions | "Marked down" clearance-stamp ink |

Usage rule: every colored block sits on `--paper` or `--paper-blue` and gets an `--ink` border. Never two accent colors touching with no border between them.

## 3. Typography

**Verdict on Bebas Neue: drop it as the system font, but keep the job it was doing.**

Bebas Neue is tall, condensed, and quite thin-stroked. That's a fine quality for a vintage poster or a fashion headline, but it's the opposite of what carries a neubrutalist page: neubrutalism reads as loud because the letterforms have *weight*, not because they're tall. At UI sizes (nav labels, buttons, form fields) Bebas Neue's condensed caps-only form also hurts legibility, and it doesn't have a matching body or mono weight, so you'd be reaching for a second, unrelated typeface for everything else anyway.

**Recommendation: IBM Plex — Sans, Sans Condensed, and Mono, together.**

All three are one free Google Fonts family, designed as a set, so nothing feels bolted on:

| Role | Font | Weight | Where |
|---|---|---|---|
| Hero / poster headline | **IBM Plex Sans Condensed** | 700 (Bold), uppercase, tight tracking | This is the direct Bebas Neue replacement — same tall, condensed, poster-in-your-face energy, but it stays in-family instead of being a random import |
| Section headings, buttons, nav, UI labels | **IBM Plex Sans** | 600–700 | The workhorse bold voice of the UI |
| Body copy, chat, descriptions, form text | **IBM Plex Sans** | 400–500 | Same family, lighter weight — good legibility for dense text (chat threads, admin tables, product descriptions) that Bebas Neue could never carry |
| Prices, timestamps, view counts, condition tags, meta info | **IBM Plex Mono** | 500–700 | Gives price tags and stamps a "printed/ticketed" texture — this is the detail that makes it feel like a real marketplace receipt, not a generic brutalist template |

Why this over the other obvious neubrutalist pairing (Space Grotesk + Space Mono): Plex has an engineering/instruments heritage (IBM designed it for technical documentation) that quietly rhymes with StudentCube's actual product categories — Drafters & Instruments, Calculators, Lab Coats. Space Grotesk is also a good font, but it's become the default "modern tech site" choice; Plex is equally solid and a step away from that particular cliché.

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');

--font-display: 'IBM Plex Sans Condensed', sans-serif;
--font-body: 'IBM Plex Sans', sans-serif;
--font-mono: 'IBM Plex Mono', monospace;
```

**Type scale**

| Use | Class starting point |
|---|---|
| Hero H1 | `font-display text-6xl md:text-8xl uppercase tracking-tight` |
| Section H2 | `font-display text-4xl md:text-5xl uppercase tracking-tight` |
| Card title / H3 | `font-body font-bold text-lg md:text-xl` |
| Body | `font-body text-base leading-relaxed` |
| Price | `font-mono font-bold text-xl` |
| Tag / badge / meta | `font-mono font-semibold text-xs uppercase tracking-wide` |

## 4. Borders, shadow, radius — the core interaction language

This is the part that has to be exact, because it's what makes something read as neubrutalist instead of just "flat design with a border."

```css
:root {
  --border-w: 3px;      /* cards, buttons, inputs, nav */
  --border-w-sm: 2px;   /* chips, badges, small tags */
  --shadow-off: 4px;    /* default hard shadow offset */
  --shadow-off-lg: 6px; /* hero elements, feature cards */
  --radius: 0px;        /* see fallback note below */
}

.brutal-block {
  border: var(--border-w) solid var(--ink);
  box-shadow: var(--shadow-off) var(--shadow-off) 0 0 var(--ink);
  border-radius: var(--radius);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

/* Hover = lift */
.brutal-block:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-off-lg) var(--shadow-off-lg) 0 0 var(--ink);
}

/* Active/click = press down onto the page */
.brutal-block:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 0 var(--ink);
}
```

**Radius:** default `0px` — true hard corners. If fully sharp corners feel too aggressive on small mobile cards during Phase 8 QA, the approved fallback is `4px` sitewide (not per-component — pick one and apply it everywhere so the system stays coherent). This is the one token allowed to change after a visual check; every other token is fixed by this doc.

**Do not** use soft/blurred box-shadows (`shadow-lg`, `shadow-xl` from default Tailwind) anywhere — every shadow in this system is hard-edged and offset, zero blur, zero spread.

## 5. Core components

| Component | Spec |
|---|---|
| **Button (primary)** | `--signal-orange` fill, `--ink` border/text-shadow-color, `.brutal-block` press behavior, `font-display uppercase` label |
| **Button (secondary)** | `--paper` fill, `--ink` border, same press behavior |
| **Button (destructive)** | `--stamp-red` fill — used only for irreversible actions (delete listing, decline offer) |
| **Card (product/listing)** | `--paper` bg, `--ink` border, `.brutal-block` hover lift, image block has its own inner border so it reads as a "photo taped onto a card," not a bleeding edge-to-edge image |
| **Input / textarea** | `--paper` bg, `--ink` border (`--border-w`), **no** default browser focus ring — focus state is a `2px` `--ledger-blue` outline offset by 2px, so it stays visible and accessible without going soft |
| **Nav bar** | `--paper` bg, `--border-w` bottom border in `--ink`, logo and links keep their exact current destinations |
| **Category icon chip** (`BrowseCategories.tsx`) | Replace the current soft rounded gradient tiles with a solid flat-color square, `--border-w-sm` `--ink` border, `0px`–`4px` radius. Rotate the fill color per category through `--signal-orange`, `--ledger-blue`, `--campus-green`, `--highlighter`, `--stamp-red`, repeating — every icon keeps enough white/black in the glyph itself to stay legible on any of those fills. This directly answers the "recolor the category icons" requirement. |

## 6. The signature element: stamped condition badges

Per the design brief's own logic (spend the one bold, memorable move in a single place, keep everything else quiet): the existing condition tags — `GOOD`, `LIKE NEW`, `TOP VIEWED` — become **ink-stamp badges**. Rotate each badge 2–4° off-axis, give it a slightly irregular stamped-edge outline (a simple `clip-path` with a few extra vertices, or an SVG rough-edge mask — no need for anything elaborate), and set the label in `font-mono uppercase`. Color per meaning: `TOP VIEWED` → `--ink` fill / white text, `LIKE NEW` → `--campus-green`, `GOOD` → `--ledger-blue`, any future "Sold" state → `--stamp-red`.

This is the one place the design is allowed to feel handmade and a little chaotic. Every other component (buttons, nav, cards) stays perfectly aligned and disciplined around it — that contrast is what makes the stamp read as a deliberate signature instead of visual noise.

## 7. Restraint checklist (apply on every phase)

- One signature element per page — for the homepage, it's the stamps. Don't invent a second "wild" element competing for attention.
- No gradients anywhere. The current teal hero gradient is fully retired.
- No drop shadows other than the hard offset shadow defined in §4.
- No decorative blur, glassmorphism, or translucency — this is the opposite aesthetic of what's being replaced.
- Every interactive element needs a visible `:focus-visible` state (thick `--ledger-blue` outline) — neubrutalism's high contrast is a genuine accessibility asset; don't lose it to a `outline: none` reset.

## 8. Hero section — after the graphic/icons are removed

The owner's instruction is to **remove** the center circular logo and the floating supply icons from `HeroSection.tsx`. That's the requirement. What (if anything) fills the resulting space is optional — either of these is a legitimate direction, pick one in Phase 2 and note the choice in `memory.md`:

- **Negative space** — headline, subhead, and stat bar simply get more room to breathe. Often the more genuinely "brutalist" choice: confident emptiness instead of filling every gap.
- **One flat geometric block** behind/beside the headline in `--signal-orange` or `--highlighter`, `--ink` border, no imagery inside it — a color-block, not a replacement illustration. Keeps the "remove the soft illustrated graphic" instruction intact while giving the section a focal anchor.

Either way: the stat bar (`0% Hidden Charges`, `<1 Min`, `~50% Average Savings`, `100% Verified Students`) becomes four `.brutal-block` chips in a row instead of plain numbers — it's already the strongest, most quantified content on the page and deserves the visual weight.

## 9. Loader

A brief (~600–900ms minimum, resolves early if assets are ready sooner — never artificially padded much past that) full-screen `--paper` overlay. Center content: the wordmark set in `font-display uppercase`, with a `.brutal-block` progress bar underneath (`--ink` border, fills left-to-right in `--signal-orange`, no gradient, no spinner circle — a spinner reads as generic; a hard-edged progress bar reads as this system). Respects `prefers-reduced-motion`: if set, the fill jumps to complete instead of animating.

## 10. Motion principles (for GSAP + Motion, applied per `phases.md` Step B)

- **Easing:** snappy and mechanical, not floaty. Use `power2.out` / `power3.out` in GSAP, or `type: "spring", stiffness: 300, damping: 24`-ish in Motion — avoid long, soft `ease-in-out` curves. This system is loud; the motion should match.
- **Press states** (§4) are CSS, always on, and don't wait for a phase's animation step — they ship with the static styling.
- **Scroll reveals:** cards/sections enter with a small hard offset (e.g., `y: 24, opacity: 0 → y: 0, opacity: 1`, 300–400ms) — no fade-only, no blur-in.
- **Stagger** product/category grids by ~60–80ms per item on entry — enough to read as intentional, not slow enough to make the user wait.
- **One orchestrated moment beats many scattered ones** — per phase, pick the single most valuable animation (e.g., the stat bar counting up on the homepage) rather than animating every element equally. Restraint applies to motion exactly like it applies to color.
- Always wrap GSAP work in the `useGSAP()` hook from `@gsap/react` (handles cleanup + React Strict Mode correctly) — never raw `useEffect` + manual `gsap.to`.
- Respect `prefers-reduced-motion` globally — reveals become instant, press-states stay (they're spatial feedback, not decoration).

## 11. Library shortlist (see `architecture.md` for install commands)

- **shadcn/ui** — base primitives (dialog, dropdown, tabs, toast) for anything StudentCube doesn't already hand-roll.
- **neobrutalism.dev** / **retroui.dev** — shadcn-CLI-compatible registries that are *already* neobrutalist. Pull structure/interaction patterns from these before hand-building a component from scratch.
- **MagicUI** — for the loader, marquee-style "Featured Products" strip, or number-counter effects (stat bar), installed the same way as shadcn components.
- **React Bits** — for any single flashy text/background effect that has no shadcn equivalent; use sparingly per the restraint checklist.
