import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE_SNAP, STAGGER_GAP, prefersReducedMotion } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger);

export interface Step {
  num: string | number;
  icon: React.ElementType;
  title: string;
  desc: string;
}

interface WorkflowProps {
  steps: Step[];
  isLoggedIn?: boolean;
}

const Workflow: React.FC<WorkflowProps> = ({ steps, isLoggedIn = false }) => {
  const containerRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion() || !containerRef.current || !stepsRef.current) return;

    // Header animation
    gsap.fromTo(
      containerRef.current.querySelector('.workflow-header'),
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: EASE_SNAP,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        }
      }
    );

    // Steps stagger animation
    gsap.fromTo(
      stepsRef.current.children,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: STAGGER_GAP,
        ease: EASE_SNAP,
        scrollTrigger: {
          trigger: stepsRef.current,
          start: "top 85%",
        }
      }
    );
  }, { scope: containerRef });

  if (isLoggedIn) {
    return null;
  }

  return (
    <section ref={containerRef} className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-paper-blue w-full relative z-10 overflow-hidden" style={{ borderTop: "var(--border-w) solid var(--color-ink)", borderBottom: "var(--border-w) solid var(--color-ink)" }}>
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto text-center relative z-10">
        
        {/* Header Section */}
        <div className="workflow-header">
          <div className="inline-block px-4 py-1.5 mb-6 bg-signal-orange text-paper text-xs md:text-sm font-mono uppercase font-bold tracking-widest brutal-block-sm">
            Simple Process
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-ink mb-4 uppercase tracking-tight">
            How It Works
          </h2>
          <p className="font-body font-medium text-ink/70 text-base md:text-lg max-w-2xl mx-auto mb-16 md:mb-20">
            Join thousands of college students buying and selling safely on StudentCube.
          </p>
        </div>

        {/* Steps Grid */}
        <div ref={stepsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 px-2 md:px-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            // Alternating colors for steps
            const badgeColors = ["bg-ledger-blue", "bg-stamp-red", "bg-campus-green", "bg-signal-orange"];
            const bgClass = badgeColors[index % badgeColors.length];
            
            return (
              <div
                key={index}
                className="group relative bg-paper brutal-block p-6 md:p-8 pt-10 md:pt-12 hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center"
              >
                <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 ${bgClass} text-paper flex items-center justify-center font-mono font-bold text-lg brutal-block-sm`}>
                  {step.num}
                </div>
                
                <div className="w-16 h-16 bg-paper-blue text-ink brutal-block-sm flex items-center justify-center mb-6 transition-all duration-300">
                  <Icon className="w-8 h-8" />
                </div>
                
                <h3 className="font-display text-xl md:text-2xl font-bold text-ink mb-3 uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="font-body font-medium text-sm md:text-base text-ink/70 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Workflow;