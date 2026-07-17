import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_SNAP, prefersReducedMotion, STAGGER_GAP } from "../lib/motion";

// Exporting the Category type so Home.tsx can use it
export interface Category {
  name: string;
  icon: React.ElementType;
  count: number;
  link: string;
  bgColor: string;
}

// Defining props for the component
interface CategoriesSectionProps {
  categories: Category[];
}

// Color rotation for category chips per design.md §5
const categoryColors = [
  "bg-signal-orange",
  "bg-ledger-blue",
  "bg-campus-green",
  "bg-highlighter",
  "bg-stamp-red",
];

const BrowseCategories: React.FC<CategoriesSectionProps> = ({ categories }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Category grid stagger entrance animation
  useGSAP(() => {
    if (prefersReducedMotion()) return;

    gsap.fromTo(
      gridRef.current?.children || [],
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: EASE_SNAP,
        stagger: STAGGER_GAP,
        delay: 0.1,
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
        }
      }
    );
  }, { scope: gridRef });

  return (
    <div className="relative z-30 w-full bg-paper">
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-10 gap-4">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-ink mb-2">
              Browse Categories
            </h2>
            <p className="font-body text-sm md:text-lg text-ink/60">
              Find exactly what you need for your courses
            </p>
          </div>
          <Link to="/buy">
            <button className="flex items-center font-body font-semibold text-sm md:text-base text-ledger-blue hover:text-ink transition-colors group brutal-focus">
              View All{" "}
              <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </Link>
        </div>

        {/* Categories Grid */}
        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const colorClass = categoryColors[index % categoryColors.length];
            return (
              <Link
                key={index}
                to={category.link}
                className="group flex min-w-0 flex-col items-center justify-center text-center p-4 sm:p-5 brutal-block bg-paper cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                style={{
                  border: "var(--border-w) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-paper mb-4 transition-transform duration-120 group-hover:scale-110 ${colorClass}`}
                  style={{
                    border: "var(--border-w-sm) solid var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <h3 className="max-w-full font-body font-bold text-sm md:text-base text-ink mb-1 leading-tight text-balance group-hover:text-ledger-blue transition-colors duration-120">
                  {category.name}
                </h3>
                <p className="font-mono text-xs md:text-sm text-ink/40 font-semibold uppercase tracking-wide">
                  {category.count} {category.count === 1 ? "item" : "items"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default BrowseCategories;
