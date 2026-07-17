import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_SNAP, prefersReducedMotion } from "../lib/motion";

interface JoinCommunityProps {
  isLoggedIn: boolean;
}

const JoinCommunity: React.FC<JoinCommunityProps> = ({ isLoggedIn }) => {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;

    gsap.fromTo(
      contentRef.current?.children || [],
      { y: 24, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.4, 
        ease: EASE_SNAP, 
        stagger: 0.1,
        delay: 0.3,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      className="relative w-full bg-paper-blue py-16 md:py-24 px-4 sm:px-6 lg:px-12"
      style={{ borderTop: "var(--border-w) solid var(--color-ink)", borderBottom: "var(--border-w) solid var(--color-ink)" }}
    >
      <div ref={contentRef} className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-ink mb-4 md:mb-6">
          Ready to Join the Community?
        </h2>
        <p className="font-body text-sm sm:text-base md:text-xl text-ink/60 mb-8 md:mb-10 max-w-2xl mx-auto px-4">
          Start buying or selling today and save money on your college
          essentials.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-5 px-6 sm:px-0">
          {isLoggedIn ? (
            <a
              href="https://chat.whatsapp.com/G7FGYX6gvU15rGMV9ygQVA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <button className="w-full sm:w-auto px-8 py-3.5 md:py-4 bg-campus-green text-ink font-body font-bold text-base md:text-lg uppercase tracking-wide brutal-block cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                style={{
                  border: "var(--border-w) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                Join WhatsApp Group
              </button>
            </a>
          ) : (
            <>
              <Link to="/getstarted" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-3.5 md:py-4 bg-signal-orange text-ink font-body font-bold text-base md:text-lg uppercase tracking-wide brutal-block cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                  style={{
                    border: "var(--border-w) solid var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  Create Free Account
                </button>
              </Link>
              <Link to="/buy" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-3.5 md:py-4 bg-paper text-ink font-body font-bold text-base md:text-lg uppercase tracking-wide brutal-block cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                  style={{
                    border: "var(--border-w) solid var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  Browse as Guest
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default JoinCommunity;
