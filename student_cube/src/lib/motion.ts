/**
 * StudentCube — Shared motion constants
 * Source: design.md §10
 *
 * Centralised easing/duration/variant values so every component
 * uses the same motion language without re-inventing constants.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger once — safe to call multiple times but only needs one
gsap.registerPlugin(ScrollTrigger);

/* ── GSAP easings ── */
export const EASE_SNAP = "power2.out";
export const EASE_SNAP_HARD = "power3.out";

/* ── Motion (framer) spring config ── */
export const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 300,
  damping: 24,
};

/* ── Scroll-reveal defaults (design.md §10) ── */
export const REVEAL_Y = 24;
export const REVEAL_DURATION = 0.35; // seconds
export const STAGGER_GAP = 0.07; // seconds, ~60-80ms per item

/* ── Reduced-motion helper ── */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
