# Phase: Dark Mode Neubrutalism

## Overview
Implement a full-site, system-aware and manually toggleable Dark Mode. The design must respect the core principles of Neubrutalism: high contrast, heavy borders, and stark aesthetics.

## Color Mapping Strategy
In Neubrutalism, the visual hierarchy is defined by `ink` (borders and text) on `paper` (backgrounds), with bright highlighters for accents.

### Light Mode (Default)
- **Paper (Background)**: `#FFFFFF` (Stark White)
- **Ink (Borders/Text)**: `#0A0A0A` (Deep Black)
- **Paper-Blue**: `#EEF2FC`

### Dark Mode
- **Paper (Background)**: `#121212` (Deep Charcoal/Black)
- **Ink (Borders/Text)**: `#F5F5F5` (Off-White)
- **Paper-Blue**: `#1E293B` (Slate 800)

*Note: Accent colors (Signal Orange, Ledger Blue, Campus Green, Stamp Red, Highlighter) remain unchanged because their high saturation provides excellent contrast against both white and black backgrounds, preserving the Neubrutalist identity.*

## Architecture
We use Tailwind v4 CSS variables to map dynamic themes:
1. Define `--theme-*` variables in `:root` (light) and `.dark` blocks in `tokens.css`.
2. Map the `@theme` block `--color-*` utilities to `var(--theme-*)`.
3. Apply `class="dark"` to `<html>` via a React Context (`ThemeContext.tsx`).
4. Persist user choice in `localStorage`.

## Execution Steps
1. Create this document and update `memory.md`.
2. Restructure `tokens.css` for dynamic variables.
3. Build `ThemeContext` and `ThemeToggle` UI.
4. Scrub legacy hardcoded colors (`bg-white`, `text-black`) out of older components like `ProductDetail.tsx`.
