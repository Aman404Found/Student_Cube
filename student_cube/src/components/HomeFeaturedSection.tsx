import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { TrendingUp, ChevronRight, MapPin, Eye } from "lucide-react";
import { getProductImageUrl } from "../utils/productImages";
import type { ProductImageValue } from "../utils/productImages";
import { BrutalCard, BrutalCardImage, BrutalCardContent, BrutalCardFooter } from "./ui/brutal-card";
import { BrutalBadge } from "./ui/brutal-badge";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_SNAP, prefersReducedMotion, STAGGER_GAP } from "../lib/motion";

interface ProductData {
  _id: string;
  title: string;
  price: number;
  originalPrice?: number;
  views: number;
  images?: ProductImageValue[];
  category: string;
  condition: string;
  location?: string;
  sellerId?: { name: string };
}

const HomeFeaturedSection = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ProductData[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  // Product grid stagger entrance animation
  useGSAP(() => {
    if (prefersReducedMotion() || featuredProducts.length === 0 || !gridRef.current || gridRef.current.children.length === 0) return;

    gsap.fromTo(
      gridRef.current.children,
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.4, 
        ease: EASE_SNAP, 
        stagger: STAGGER_GAP,
        delay: 0.3,
        clearProps: "all",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
        }
      }
    );
  }, { scope: gridRef, dependencies: [featuredProducts] });

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/products/featured`,
        );
        setFeaturedProducts(res.data);
      } catch (error) {
        console.error("Failed to load featured products", error);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 md:mb-3 brutal-block-sm bg-stamp-red text-paper"
            style={{
              border: "var(--border-w-sm) solid var(--color-ink)",
              borderRadius: "var(--brutal-radius)",
            }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] md:text-[11px] font-semibold uppercase tracking-wide">
              Hot Deals
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-ink mb-2">
            Featured Products
          </h2>
          <p className="font-body text-sm md:text-lg text-ink/60">
            Hand-picked deals you don't want to miss
          </p>
        </div>
        <Link to="/buy">
          <button className="flex items-center font-body font-semibold text-sm md:text-base text-ledger-blue hover:text-ink transition-colors group brutal-focus">
            View All{" "}
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {featuredProducts.map((prod) => {
          const hasDiscount = prod.originalPrice && prod.price && prod.originalPrice > prod.price;
          const discountPercentage = hasDiscount 
            ? Math.round(((prod.originalPrice! - prod.price) / prod.originalPrice!) * 100) 
            : null;

          return (
          <Link
            key={prod._id}
            to={`/product/${prod._id}`}
            className="group flex flex-col h-full"
          >
            <BrutalCard
              noHover
              className="cursor-pointer flex flex-col h-full"
            >
            <BrutalCardImage className="relative h-40 sm:h-48 w-full bg-paper-blue">
              {prod.images && prod.images.length > 0 ? (
                <img
                  src={getProductImageUrl(prod.images[0])}
                  alt={prod.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-paper-blue flex items-center justify-center text-ink/40 font-mono text-sm">
                  No Image
                </div>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <BrutalBadge condition="top-viewed">Top Viewed</BrutalBadge>
              </div>
            </BrutalCardImage>

            <BrutalCardContent className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-3 gap-4">
                <span className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-ink/60 px-2 py-1 bg-paper-blue"
                  style={{
                    border: "var(--border-w-sm) solid var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  {prod.category || 'OTHERS'}
                </span>
                <BrutalBadge condition={prod.condition?.toLowerCase() === "like new" ? "like-new" : "good"}>
                  {prod.condition || 'GOOD'}
                </BrutalBadge>
              </div>
              <h3 className="font-body font-bold text-sm text-ink mb-3 line-clamp-2 leading-snug">
                {prod.title}
              </h3>

              {prod.location && (
                <div className="flex items-center text-xs text-ink/60 mb-3">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-ink/40" />{" "}
                  {prod.location}
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] uppercase bg-paper text-ink"
                  style={{
                    border: "var(--border-w-sm) solid var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  {prod.sellerId?.name?.charAt(0) || "U"}
                </div>
                <span className="font-body text-xs text-ink/60 font-medium">
                  {typeof prod.sellerId === "object"
                    ? prod.sellerId.name
                    : "Unknown User"}
                </span>
              </div>
            </BrutalCardContent>

            <BrutalCardFooter className="pt-4 mt-auto flex justify-between border-t" style={{ borderTopColor: "var(--color-ink)", borderTopWidth: "var(--border-w-sm)", borderTopStyle: "solid" }}>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="font-mono font-bold text-lg sm:text-xl text-ink">
                    ₹{prod.price?.toLocaleString("en-IN") || prod.price}
                  </div>
                  {hasDiscount && (
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-stamp-red text-paper border-[var(--border-w-sm)] border-solid border-ink shadow-[2px_2px_0_0_var(--color-ink)] -rotate-3">
                      {discountPercentage}% OFF
                    </span>
                  )}
                </div>
                {prod.originalPrice && (
                  <div className="text-[10px] text-ink/40 line-through font-mono">
                    ₹{prod.originalPrice.toLocaleString("en-IN")}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] text-ink/40 font-semibold">
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" /> {prod.views || 0}
                </span>
              </div>
            </BrutalCardFooter>
          </BrutalCard>
          </Link>
        )})}
      </div>
    </section>
  );
};

export default HomeFeaturedSection;
