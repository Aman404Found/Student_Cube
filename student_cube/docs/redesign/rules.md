# StudentCube — Agent Rules
### `rules.md` — read this before every phase, not just the first one

These rules outrank convenience. If a task in `phases.md` seems to require breaking one of these, stop and flag it instead of proceeding.

---

## 1. Never do this

- **Never edit anything inside `student_cube_backend/`.** Not a config value, not a comment, not a formatting pass. If a frontend change seems to need a backend change to work (e.g., a field the API doesn't return), stop and flag it — do not "just quickly" add it.
- **Never change what a link, button, or logo does.** `href`s, `onClick` handlers, `<Link to="...">` targets, and route paths stay byte-for-byte identical. Restyle the button; never retarget it.
- **Never remove a logo, brand mark, or footer/nav link** to "clean up" a layout. If the new layout genuinely has no room for something, flag it — don't quietly drop it.
- **Never touch `AuthContext.tsx` logic, `RealtimeBridge.tsx`, payment flow logic, or any `.ts`/`.js` file whose job is data/business logic rather than rendering.** If a file mixes logic and markup, restyle the JSX/className output and leave the logic branches untouched.
- **Never introduce a new state management library, CSS-in-JS system, or component framework.** Stay inside React + Tailwind v4 + the libraries named in `architecture.md`.
- **Never delete or rename an existing component file** without flagging it first — restyle in place. Renaming breaks imports across the codebase silently.
- **Never change an existing component's exported props/interface** in a way that breaks its call sites, unless the change is purely additive (a new optional prop).
- **Never ship a phase's animation step before that phase's static styling is verified working** (`npm run dev` renders correctly, `npm run build` is clean). Animation is layered on top, never in the same commit as untested static markup.
- **Never use `outline: none` without replacing it with a visible custom focus style.** See `design.md` §7 — the focus ring is load-bearing for accessibility.
- **Never leave `console.log`/debug artifacts** in committed code.

## 2. Always do this

- **Read `memory.md` before starting any session.** It's the source of truth for what phase you're on and what's already been decided (palette confirmed, font confirmed, radius confirmed, etc.) — don't re-derive decisions that are already logged.
- **Work one phase at a time**, in the order defined in `phases.md`, unless the owner explicitly says to jump ahead.
- **Verify before moving on:** after a phase's static step, run the build and manually confirm no route/link/button target changed. After a phase's animation step, confirm `prefers-reduced-motion` still degrades gracefully.
- **Update `memory.md` at the end of every phase** — files touched, decisions made, anything deferred or deviated from the plan, and why.
- **Ask before deleting any file.** Restyling doesn't require deletion in almost all cases; if it seems to, that's a flag, not a silent action.
- **Prefer an existing library component (shadcn / neobrutalism.dev / retroui.dev / MagicUI / React Bits) over hand-rolling one from scratch**, per `architecture.md` §4 — but always re-map its colors/borders/shadows onto the tokens in `design.md`, never ship it at registry defaults.
- **Keep every new component typed** — no `any`, matching the rest of the codebase.
- **Use `cn()` from `src/lib/utils.ts`** for conditional Tailwind classes instead of manual string concatenation.
- **Use the `useGSAP()` hook from `@gsap/react`** for all GSAP work — never raw `useEffect` + `gsap.to()`.

## 3. Design fidelity rules

- Every new/restyled component pulls its colors, fonts, border widths, and shadow values from `design.md` — no ad-hoc hex codes or arbitrary Tailwind spacing values invented mid-phase.
- No gradients, no soft/blurred shadows, no glassmorphism — this is a full retirement of the current visual language, not a blend of old and new.
- The stamped-badge signature element (`design.md` §6) stays the one "loud" element per page. Don't add a second competing signature mid-project without updating `design.md` first.

## 4. Process rules

- If a phase in `phases.md` turns out to be too large for one session, stop at a clean sub-boundary (e.g., "Navbar done, Footer not started") rather than half-finishing both — log the exact stopping point in `memory.md`.
- If you (the agent) disagree with a spec in `design.md` on craft grounds, say so and propose the alternative — don't silently deviate. Log the final decision either way.
- If a new dependency seems genuinely necessary and isn't in `architecture.md`'s library list, flag it with a one-line justification before installing it.

## 5. Definition of done, per phase

A phase is not complete until all of the following are true:

- [ ] Static neubrutalist styling applied, matching `design.md` tokens.
- [ ] `npm run build` passes with no new TypeScript errors.
- [ ] Every link/button/logo in the touched files still points to its original target — spot-checked, not assumed.
- [ ] Animation step (GSAP/Motion) applied on top, respecting `prefers-reduced-motion`.
- [ ] Responsive check at mobile width for the touched components.
- [ ] `memory.md` updated with a dated entry for this phase.
