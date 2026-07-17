import React, { useRef } from "react";
import { ShieldCheck, CheckCircle2, Shield, Users } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { prefersReducedMotion, EASE_SNAP } from "../lib/motion";

interface SafetyBannerProps {
  isLoggedIn?: boolean;
}

const SafetyBanner: React.FC<SafetyBannerProps> = ({ isLoggedIn = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion() || isLoggedIn) return;
    
    gsap.fromTo(containerRef.current,
      { y: 30, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 0.6, ease: EASE_SNAP, delay: 0.2,
        scrollTrigger: { trigger: containerRef.current, start: "top 85%" }
      }
    );
  }, { scope: containerRef, dependencies: [isLoggedIn] });

  if (isLoggedIn) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-12 bg-paper relative z-10" ref={containerRef}>
      <div className="max-w-5xl mx-auto bg-ledger-blue brutal-block p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-12 group overflow-hidden relative">
        {/* Main Icon Container */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-paper text-ink brutal-block flex shrink-0 items-center justify-center group-hover:scale-105 transition-transform duration-500 ease-out z-10">
          <ShieldCheck className="w-10 h-10 md:w-16 md:h-16" />
        </div>

        {/* Text Content */}
        <div className="text-center md:text-left z-10">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-paper mb-3 md:mb-4 tracking-tight uppercase">
            Your Safety is Our Priority
          </h2>
          <p className="font-body text-paper/90 text-sm sm:text-base md:text-lg mb-6 leading-relaxed font-medium">
            We strictly verify every student profile to keep our community 100%
            genuine and secure. No spam, no fake profiles-just safe and easy
            peer-to-peer trading.{" "}
            <strong className="text-paper block sm:inline mt-2 sm:mt-0 font-extrabold uppercase">
              Trade with complete peace of mind!
            </strong>
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
            <span className="bg-campus-green text-ink border-[var(--border-w-sm)] border-solid border-ink text-[10px] sm:text-xs md:text-sm font-mono font-bold px-3 py-1.5 md:px-4 md:py-2 uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_var(--color-ink)] transition-all cursor-default">
              <Shield className="w-3 h-3 md:w-4 md:h-4" />
              Secure In-App Chat
            </span>
            <span className="bg-campus-green text-ink border-[var(--border-w-sm)] border-solid border-ink text-[10px] sm:text-xs md:text-sm font-mono font-bold px-3 py-1.5 md:px-4 md:py-2 uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_var(--color-ink)] transition-all cursor-default">
              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
              Verified Students
            </span>
            <span className="bg-campus-green text-ink border-[var(--border-w-sm)] border-solid border-ink text-[10px] sm:text-xs md:text-sm font-mono font-bold px-3 py-1.5 md:px-4 md:py-2 uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_var(--color-ink)] transition-all cursor-default">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              Safe Campus Meetups
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafetyBanner;
