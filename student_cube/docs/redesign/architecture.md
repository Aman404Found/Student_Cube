# StudentCube — Redesign Architecture
### `architecture.md` — what changes, what doesn't, and how the new pieces fit into the existing repo

---

## 1. Baseline (unchanged)

This entire project happens inside `student_cube/` (the frontend). Nothing below ever changes as part of this redesign:

- `student_cube_backend/` — the whole directory. No exceptions.
- `student_cube/src/context/AuthContext.tsx` — logic untouched; it may render restyled children.
- `student_cube/src/hooks/useDevToolsBlocker.tsx` — untouched.
- `student_cube/src/utils/api.ts`, `colleges.ts`, `productImages.ts` — untouched.
- `student_cube/src/components/RealtimeBridge.tsx`, `AdminRoute.tsx`, `AmbassadorRoute.tsx` — logic untouched (no visual output of their own to restyle).
- React Router routes in `App.tsx` — paths, guards, and nesting stay exactly as they are. Only the JSX/className output of the page components they render changes.
- `package.json` scripts, `vite.config.ts` build config, `tsconfig.json` — untouched unless a new library's setup step requires a documented, minimal addition (e.g., a Tailwind plugin registration).

## 2. What's added

```
student_cube/
├── src/
│   ├── styles/
│   │   └── tokens.css              # NEW — all design tokens from design.md as CSS variables + @theme
│   ├── components/
│   │   ├── Loader.tsx               # NEW — full-site loader, see design.md §9
│   │   └── ui/
│   │       ├── brutal-button.tsx    # NEW (or shadcn "button" restyled in place — agent's call per phase)
│   │       ├── brutal-card.tsx      # NEW
│   │       ├── brutal-badge.tsx     # NEW — the stamped condition badge, design.md §6
│   │       └── ...                  # any further shadcn/MagicUI/React Bits additions land here, alongside the existing lens/spotlight-bg/canvas-text primitives
│   │   
│   ├── lib/
│   │   ├── utils.ts                 # EXISTING — untouched, keep using cn() from here
│   │   └── motion.ts                # NEW — shared GSAP/Motion setup: ScrollTrigger registration, shared easing constants, shared variants
│   └── index.css                    # EDITED — imports tokens.css, Tailwind v4 @theme block
└── components.json                  # NEW — created by `shadcn init`, points the CLI at the existing src/components/ui path
```

Nothing is added to `student_cube_backend/`.

## 3. Tailwind v4 theming approach

The stack already uses Tailwind v4 (`@tailwindcss/vite` + `@tailwindcss/postcss`). v4's theme configuration is CSS-first, so:

- **New tokens** (colors, font families, border widths, shadow values from `design.md`) are defined with an `@theme` block inside `src/styles/tokens.css`, imported once from `index.css`. This is the v4-native approach and keeps every token in one file the agent (and the owner) can scan in one pass.
- `tailwind.config.js` stays in place only for anything `@theme` can't express (plugin registration, content globs) — it does not duplicate the color/font tokens.

```css
/* src/styles/tokens.css */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');

@theme {
  --color-ink: #0A0A0A;
  --color-paper: #FFFFFF;
  --color-paper-blue: #EEF2FC;
  --color-signal-orange: #FF5A1F;
  --color-campus-green: #12B76A;
  --color-ledger-blue: #2952E3;
  --color-highlighter: #FFD400;
  --color-stamp-red: #FF3B5C;

  --font-display: 'IBM Plex Sans Condensed', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

This makes every token available immediately as a Tailwind utility (`bg-signal-orange`, `border-ink`, `font-display`, etc.) with no extra config wiring.

## 4. Component library plan (verified current install paths)

All three integrate through the **same CLI** — `shadcn` — which matters because it means one install pattern for the whole project instead of three different toolchains.

| Library | What it's for | Install |
|---|---|---|
| **shadcn/ui** | Base accessible primitives: dialog, dropdown, tabs, toast, select | `npx shadcn@latest init` once, then `npx shadcn@latest add <component>` per component |
| **neobrutalism.dev / retroui.dev** | Pre-built neobrutalist shadcn registries — a huge head start on button/card/badge/input patterns that already match this brief | Same CLI once pointed at the registry, e.g. `npx shadcn@latest add @neobrutalism/button` — use as a structural reference even where the final styling is hand-tuned to `design.md`'s tokens |
| **MagicUI** | Animated pieces: number counters (stat bar), marquee (featured products), the loader | `npx shadcn@latest add @magicui/<component-name>` |
| **React Bits** | One-off flashy effects with no shadcn equivalent, TS+Tailwind variant to match this stack | `npx shadcn@latest add "https://reactbits.dev/r/ComponentName-TS-TW"` |

Use sparingly — `design.md` §7's restraint checklist applies to library components too. Pulling in a component doesn't override the token system; every imported component gets its colors/borders/shadows mapped to `tokens.css`, not left at its registry defaults.

## 5. Animation library plan

| Library | Install | Use for |
|---|---|---|
| **Motion** (formerly Framer Motion — package renamed, same team) | `npm install motion` — import from `motion/react`, **not** the deprecated `framer-motion` path | Component-level transitions: hover/press states beyond what pure CSS handles, `AnimatePresence` for modals (e.g. `ForgotPasswordModal.tsx`), layout animations |
| **GSAP** + **@gsap/react** | `npm install gsap @gsap/react` | Scroll-triggered reveals (`ScrollTrigger`), the stat-bar count-up, any timeline-based sequence (loader fill, multi-step hero entrance) |

Always use the `useGSAP()` hook from `@gsap/react` for any GSAP work inside a component — it's the official React integration, handles cleanup and React Strict Mode's double-invoke automatically. Raw `useEffect` + manual `gsap.to()` is not used in this codebase; it leaks listeners on unmount.

```tsx
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const sectionRef = useRef<HTMLDivElement>(null);

useGSAP(() => {
  gsap.from(".stat-chip", { y: 24, opacity: 0, stagger: 0.08, ease: "power2.out" });
}, { scope: sectionRef });
```

## 6. File impact map

| Status | Files |
|---|---|
| **Touched — visual only** | `Navbar.tsx`, `Footer.tsx`, `FooterMin.tsx`, `HeroSection.tsx`, `BrowseCategories.tsx`, `HomeFeaturedSection.tsx`, `RecentViewedSection.tsx`, `JoinCommunity.tsx`, `SafetyBanner.tsx`, `Workflow.tsx`, `ForgotPasswordModal.tsx`, all files in `pages/`, `AdminAmbassadorsPanel.tsx`, `AdminPaymentPanel.tsx`, `AdminReviewPanel.tsx`, `App.css`, `index.css` |
| **Touched — additive only (new imports/wrapping, no logic edits)** | `main.tsx` (mount `Loader`), `App.tsx` (no route changes, just whatever wrapping the loader needs) |
| **New files** | Everything listed in §2 |
| **Never touched** | Everything listed in §1 |

## 7. Loader mount point

`Loader.tsx` wraps around the existing `<App />` render in `main.tsx`, controlling a simple `isReady` boolean (resolves on `window.onload` plus the loader's own minimum-display timer from `design.md` §9, whichever is later). It does not block the WebSocket connection or auth check from initializing in the background — those still start immediately; the loader only gates the *visual* reveal.

## 8. TypeScript conventions

- No `any` — every new component gets a typed props interface, matching the strictness already implied by the existing `.tsx` codebase.
- Reuse `cn()` from `src/lib/utils.ts` for conditional class merging — don't reintroduce `clsx`/`tailwind-merge` separately in a new component.
