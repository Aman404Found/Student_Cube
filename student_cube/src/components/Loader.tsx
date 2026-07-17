/**
 * Loader — full-site neubrutalist loader (Phase 0 Step B — GSAP animated)
 * Spec: design.md §9, architecture.md §7
 *
 * Shows on hard reload / first load only (not on in-app route changes).
 * Paper overlay, centered wordmark in font-display uppercase, with a
 * brutal-block progress bar animated left-to-right in signal-orange via GSAP.
 *
 * Resolves when:
 *   1. window.onload has fired (assets ready), AND
 *   2. a minimum display time of ~800ms has elapsed.
 *
 * Respects prefers-reduced-motion: fill jumps to complete instead of animating.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BrutalLoader } from "./ui/brutal-loader";

interface LoaderProps {
  /** Minimum time the loader stays visible (ms). */
  minDisplayMs?: number;
  children: React.ReactNode;
}

function Loader({ children }: LoaderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const loaderRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const resolve = useCallback(() => {
    setIsReady(true);
    setIsFadingOut(true);
    // Wait for the slide-up transition to finish before unmounting
    const timeout = setTimeout(() => setIsVisible(false), 700);
    return () => clearTimeout(timeout);
  }, []);

  const [animationDone, setAnimationDone] = useState(false);
  const [windowLoaded, setWindowLoaded] = useState(false);

  // ── Window-load gate ──
  useEffect(() => {
    if (document.readyState === "complete") {
      setWindowLoaded(true);
    } else {
      const onLoad = () => setWindowLoaded(true);
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  // ── Trigger resolve when BOTH are ready ──
  useEffect(() => {
    if (animationDone && windowLoaded && !isReady) {
      resolve();
    }
  }, [animationDone, windowLoaded, isReady, resolve]);

  // ── GSAP animation: progress bar fill + wordmark entrance ──
  useGSAP(
    () => {
      if (!fillRef.current || !wordmarkRef.current) return;

      if (reducedMotion) {
        // Instant — no animation, just show everything at final state
        gsap.set(fillRef.current, { width: "100%" });
        gsap.set(".wordmark-letter", { opacity: 1, y: 0, rotateX: 0 });
        setAnimationDone(true);
        return;
      }

      const tl = gsap.timeline();

      // Wordmark letters stagger in with a brutalist bounce
      tl.fromTo(
        gsap.utils.toArray(".wordmark-letter"),
        {
          y: 40,
          opacity: 0,
          rotateX: -90,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.04,
        }
      );

      // Progress bar fills with a snappy ease
      tl.to(
        fillRef.current,
        {
          width: "100%",
          duration: 0.7,
          ease: "power3.inOut",
          onComplete: () => setAnimationDone(true),
        },
        "-=0.2" // overlap with wordmark entrance
      );
    },
    { scope: loaderRef },
  );

  return (
    <>
      {isVisible && (
        <div
          ref={loaderRef}
          className={`
            fixed inset-0 z-[9999] flex flex-col items-center justify-center
            bg-highlighter 
            transition-transform duration-700 ease-in-out
            ${isFadingOut ? "-translate-y-full" : "translate-y-0"}
          `}
          aria-hidden={isReady}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={isReady ? 100 : undefined}
        >
          {/* Tumbling Cube */}
          <BrutalLoader size="lg" className="mb-8" />

          {/* Wordmark */}
          <h1
            ref={wordmarkRef}
            className="font-display text-4xl md:text-6xl uppercase tracking-tight text-[#0A0A0A] select-none mb-8 flex"
            style={{ perspective: "400px" }}
          >
            {"StudentCube".split("").map((char, i) => (
              <span
                key={i}
                className="wordmark-letter inline-block "
                style={{ opacity: reducedMotion ? 1 : 0 }}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* Progress bar container — brutal-block */}
          <div
            className="w-64 md:w-80 h-5 bg-paper "
            style={{
              border: "var(--border-w) solid var(--color-ink)",
              boxShadow:
                "var(--shadow-off) var(--shadow-off) 0 0 #0A0A0A",
              borderRadius: "var(--brutal-radius)",
            }}
          >
            {/* GSAP-animated fill bar */}
            <div
              ref={fillRef}
              className="h-full bg-signal-orange"
              style={{
                width: reducedMotion ? "100%" : "0%",
                borderRadius: "var(--brutal-radius)",
              }}
            />
          </div>
        </div>
      )}

      {/* Children always mount so auth/websocket can initialise in background */}
      <div
        style={{
          visibility: isReady ? "visible" : "hidden",
          opacity: isReady ? 1 : 0,
          transition: "opacity 300ms ease-out",
        }}
      >
        {children}
      </div>
    </>
  );
}

export default Loader;
