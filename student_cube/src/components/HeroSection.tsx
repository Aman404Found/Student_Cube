import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_SNAP, prefersReducedMotion, STAGGER_GAP } from "../lib/motion";
import FloatingShapes from "./ui/FloatingShapes";

export interface Stat {
  value: string | number;
  label: string;
}

interface HeroSectionProps {
  stats: Stat[];
}

const HeroSection: React.FC<HeroSectionProps> = ({ stats }) => {
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buyBtnRef = useRef<HTMLButtonElement>(null);
  const sellBtnRef = useRef<HTMLButtonElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Hero entrance animation
  useGSAP(() => {
    if (prefersReducedMotion()) return;

    // Headline entrance
    gsap.fromTo(
      headlineRef.current,
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: EASE_SNAP, 
        delay: 0.2,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top 85%",
        }
      }
    );

    // subtitle entrance
    gsap.fromTo(
      subtitleRef.current,
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: EASE_SNAP, 
        delay: 0.3,
        scrollTrigger: {
          trigger: subtitleRef.current,
          start: "top 85%",
        }
      }
    );

    // buy button entrance
    gsap.fromTo(
      buyBtnRef.current,
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: EASE_SNAP, 
        delay: 0.4,
        scrollTrigger: {
          trigger: buyBtnRef.current,
          start: "top 85%",
        }
      }
    );

    // sell button entrance
    gsap.fromTo(
      sellBtnRef.current,
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: EASE_SNAP, 
        delay: 0.5,
        scrollTrigger: {
          trigger: sellBtnRef.current,
          start: "top 85%",
        }
      }
    );

    // Stats stagger entrance
    gsap.fromTo(
      statsRef.current?.children || [],
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: EASE_SNAP, 
        stagger: STAGGER_GAP, 
        delay: 0.4,
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 95%",
        }
      }
    );
  }, { scope: heroRef });

  return (
    <section
      ref={heroRef}
      className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center px-4 pt-16 md:pt-20 pb-10 bg-paper overflow-hidden"
    >
      <FloatingShapes />

      {/* Trust Badge */}
      <div className="flex items-center gap-2.5 px-4 py-2 md:px-5 md:py-2.5 mb-8 md:mb-10 brutal-block-sm bg-paper-blue z-1"
        style={{
          border: "var(--border-w-sm) solid var(--color-ink)",
          borderRadius: "var(--brutal-radius)",
        }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-campus-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-campus-green"
            style={{
              border: "var(--border-w-sm) solid var(--color-ink)",
            }}
          ></span>
        </span>
        <span className="font-mono text-xs md:text-sm font-semibold uppercase tracking-wide text-ink">
          Trusted by many college students
        </span>
      </div>

      {/* Main Heading */}
      <h1 ref={headlineRef} className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tight text-ink mb-6 md:mb-8 leading-tight">
        Buy & Sell College
        <br />
        <span className="text-signal-orange">Accessories Safely</span>
      </h1>

      {/* Subtitle */}
      <p ref={subtitleRef} className="font-body text-base md:text-xl max-w-3xl mx-auto leading-relaxed text-ink/80 mb-12 px-2">
        The trusted marketplace for all college students. Find Darfters, Lab Coat, IOT, Robotics Items and more at amazing prices. Join{" "}
        <span className="inline-block align-middle mx-1 font-bold text-signal-orange">
          StudentCube
        </span>{" "}
        today!
      </p>

      {/* Call to Action Buttons */}
      <div className="flex flex-col sm:flex-row w-full max-w-lg px-6 sm:w-auto gap-4 mb-16">
        <Link to="/buy" className="w-full sm:w-auto">
          <button ref={buyBtnRef} className="w-full px-8 py-3.5 bg-signal-orange text-ink font-body font-bold text-sm md:text-base uppercase tracking-wide brutal-block cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
            style={{
              border: "var(--border-w) solid var(--color-ink)",
              borderRadius: "var(--brutal-radius)",
            }}
          >
            Start Shopping
          </button>
        </Link>
        <Link to="/sell" className="w-full sm:w-auto">
          <button ref={sellBtnRef} className="w-full px-8 py-3.5 bg-paper text-ink font-body font-bold text-sm md:text-base uppercase tracking-wide brutal-block cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
            style={{
              border: "var(--border-w) solid var(--color-ink)",
              borderRadius: "var(--brutal-radius)",
            }}
          >
            Sell Your Items
          </button>
        </Link>
      </div>

      {/* Stats Grid - brutal-block chips */}
      <div ref={statsRef} className="w-full max-w-5xl px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="px-4 py-4 md:px-6 md:py-6 brutal-block bg-paper"
            style={{
              border: "var(--border-w) solid var(--color-ink)",
              borderRadius: "var(--brutal-radius)",
            }}
          >
            <h3 className="font-mono font-bold text-2xl sm:text-3xl md:text-4xl text-ink mb-1 md:mb-2">
              {stat.value}
            </h3>
            <p className="font-mono text-xs md:text-sm font-semibold uppercase tracking-wide text-ink/60">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
