import React, { useRef } from "react";
import { Star, Quote, User } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { prefersReducedMotion, EASE_SNAP } from "../lib/motion";
import sparkImg from "../assets/spark.jpeg";
import aheadImg from "../assets/ahead.jpeg";

const endorsementsData = [
  {
    id: 1,
    name: "Biswa Mohan Singh",
    college: "MSIT, GGSIPU",
    role: "Co-Founder and Chief Advisor",
    society: "SPARK",
    quote: "Everyone want convenience, affordability and community-building aspects of a student-to-student marketplace, nothing of this sort exists before you. I really love the platform and concept, let's grow this together.",
    bgColor: "bg-[#FFF699]",
    textColor: "text-[#0a0a0a]",
    rating: 5,
    image: sparkImg,
  },
  {
    id: 2,
    name: "Sweta Bhattacharjee",
    college: "Maharaja Agrasen Institute of Technology",
    role: "Founder",
    society: "Ahead",
    quote: "Student Cube addresses a genuine campus need by making it easy to pass on academic essentials through a trusted campus marketplace. It's an initiative that promotes affordability, sustainability, and a stronger student community that can benefit students across colleges. I fully support this initiative and look forward to its growth.",
    bgColor: "bg-[#B7E7F3]",
    textColor: "text-[#0a0a0a]",
    rating: 5,
    image: aheadImg,
  },
];

const Endorsements: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // Animate the header
      gsap.fromTo(
        ".endorsement-header",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: EASE_SNAP,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        }
      );

      // Animate the cards stagger
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: 0.2 + index * 0.15,
            ease: EASE_SNAP,
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 75%",
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-paper relative z-10 border-t-[length:var(--border-w)] border-ink"
    >
      <div className="max-w-6xl mx-auto">
        <div className="endorsement-header mb-12 md:mb-16 text-center">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-ink uppercase tracking-tight shadow-sm inline-block">
            Trusted By Campus Voices
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {endorsementsData.map((endorsement, index) => (
            <div
              key={endorsement.id}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`brutal-block relative group ${endorsement.bgColor} p-6 sm:p-8 flex flex-col justify-between`}
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 opacity-20">
                <Quote className={`w-12 h-12 sm:w-16 sm:h-16 ${endorsement.textColor}`} />
              </div>

              {/* Review Content */}
              <div className="relative z-10 mb-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(endorsement.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 fill-current text-[#0a0a0a]`}
                    />
                  ))}
                </div>
                <p
                  className={`font-body text-base sm:text-lg font-bold leading-relaxed ${endorsement.textColor}`}
                >
                  "{endorsement.quote}"
                </p>
              </div>

              {/* Reviewer Profile */}
              <div className="relative z-10 flex items-start gap-4 mt-auto border-t-[length:var(--border-w-sm)] border-current pt-6">
                <div className="w-12 h-12 bg-paper border-[length:var(--border-w)] border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] flex items-center justify-center shrink-0 overflow-hidden">
                  {endorsement.image ? (
                    <img src={endorsement.image} alt={endorsement.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-ink" />
                  )}
                </div>
                <div>
                  <h4 className={`font-display text-lg sm:text-xl font-bold uppercase ${endorsement.textColor}`}>
                    {endorsement.name}
                  </h4>
                  <p className={`font-mono text-xs sm:text-sm font-semibold opacity-90 ${endorsement.textColor}`}>
                    {endorsement.role}, {endorsement.society}
                  </p>
                  <p className={`font-body text-xs mt-0.5 opacity-80 font-medium ${endorsement.textColor}`}>
                    {endorsement.college}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Endorsements;
