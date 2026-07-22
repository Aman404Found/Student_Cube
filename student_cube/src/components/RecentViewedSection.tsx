import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Eye } from 'lucide-react';
import api from '../utils/api';
import { getProductImageUrl } from '../utils/productImages';
import type { ProductImageValue } from '../utils/productImages';
import { BrutalCard, BrutalCardImage, BrutalCardContent, BrutalCardFooter } from './ui/brutal-card';
import { BrutalBadge } from './ui/brutal-badge';
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_SNAP, prefersReducedMotion, STAGGER_GAP } from "../lib/motion";
import { useAuth } from "../context/AuthContext";

interface RecentProduct {
  _id: string;
  title?: string;
  name?: string;
  price?: number;
  originalPrice?: number;
  category?: string;
  condition?: string;
  views?: number;
  images?: ProductImageValue[]; 
  [key: string]: unknown;
}

const RecentViewedSection = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const storageKey = userId ? `recentProducts_${userId}` : 'recentProducts_guest';

  const [recentlyViewed, setRecentlyViewed] = useState<RecentProduct[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [isCheckingRecent, setIsCheckingRecent] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  // Product grid stagger entrance animation
  useGSAP(() => {
    if (prefersReducedMotion() || recentlyViewed.length === 0 || !gridRef.current || gridRef.current.children.length === 0) return;

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
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
        }
      }
    );
  }, { dependencies: [recentlyViewed] });

  useEffect(() => {
    let isMounted = true;

    const validateRecentProducts = async () => {
      const savedProducts = (() => {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
          return Array.isArray(saved) ? saved : [];
        } catch {
          return [];
        }
      })();

      const ids = [...new Set(
        savedProducts
          .map((product) => product?._id)
          .filter((id): id is string => Boolean(id)),
      )].slice(0, 4);

      if (ids.length === 0) {
        localStorage.removeItem(storageKey);
        if (isMounted) {
          setRecentlyViewed([]);
          setIsCheckingRecent(false);
        }
        return;
      }

      try {
        const response = await api.post('/products/recent', { ids });
        const validProducts = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        if (!isMounted) return;

        setRecentlyViewed(validProducts);
        if (validProducts.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(validProducts));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error("Error validating recent products:", error);
        if (isMounted) {
          setRecentlyViewed([]);
        }
      } finally {
        if (isMounted) {
          setIsCheckingRecent(false);
        }
      }
    };

    validateRecentProducts();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  if (isCheckingRecent || recentlyViewed.length === 0) return null;

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">

      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-10 gap-4">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-ink mb-2">
            Recently Viewed
          </h2>
          <p className="font-body text-sm md:text-lg text-ink/60">
            Pick up right where you left off
          </p>
        </div>
        <Link to="/buy">
          <button className="flex items-center font-body font-semibold text-sm md:text-base text-ledger-blue hover:text-ink transition-colors group brutal-focus">
            Browse All{" "}
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>

      {/* === CARDS GRID === */}
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentlyViewed.map((prod) => {
          const hasDiscount = prod.originalPrice && prod.price && prod.originalPrice > prod.price;
          const discountPercentage = hasDiscount 
            ? Math.round(((prod.originalPrice! - prod.price!) / prod.originalPrice!) * 100) 
            : null;

          return (
            // Card Container
            <Link
              key={prod._id}
              to={`/product/${prod._id}`}
              className="group flex flex-col h-full"
            >
              <BrutalCard noHover className="flex flex-col h-full">
                <BrutalCardImage className="relative h-48 bg-paper-blue">
                  {prod.images && prod.images.length > 0 ? (
                    <img
                      src={getProductImageUrl(prod.images[0])}
                      alt={prod.title || prod.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-paper-blue flex items-center justify-center text-ink/40 font-mono text-sm">
                      No Image
                    </div>
                  )}

                  {/* VIEWED Badge */}
                  <div className="absolute top-3 left-3">
                    <BrutalBadge condition="top-viewed">Viewed</BrutalBadge>
                  </div>
                </BrutalCardImage>

                <BrutalCardContent className="flex flex-col grow">
                  {/* Tags Row */}
                  <div className="flex justify-between items-center mb-3 gap-4">
                    <span
                      className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ink/60 px-2 py-1 bg-paper-blue"
                      style={{
                        border: "var(--border-w-sm) solid var(--color-ink)",
                        borderRadius: "var(--brutal-radius)",
                      }}
                    >
                      {prod.category || "OTHERS"}
                    </span>
                    <BrutalBadge
                      condition={
                        prod.condition?.toLowerCase() === "like new"
                          ? "like-new"
                          : "good"
                      }
                    >
                      {prod.condition || "GOOD"}
                    </BrutalBadge>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-body font-bold text-lg text-ink mb-3 line-clamp-1 group-hover:text-ledger-blue transition-colors">
                    {prod.title || prod.name}
                  </h3>

                  {/* User Info Row - ANONYMIZED */}
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-6 h-6 flex items-center justify-center font-mono font-bold text-xs uppercase bg-paper text-ink"
                      style={{
                        border: "var(--border-w-sm) solid var(--color-ink)",
                        borderRadius: "var(--brutal-radius)",
                      }}
                    >
                      U
                    </div>
                    <span className="font-body text-sm font-bold text-ink/60">
                      Unknown User
                    </span>
                  </div>

                  {/* Spacer to push price to bottom */}
                  <div className="grow"></div>
                </BrutalCardContent>

                <BrutalCardFooter
                  className="pt-4 mt-auto border-t flex justify-between"
                  style={{
                    borderTopColor: "var(--color-ink)",
                    borderTopWidth: "var(--border-w-sm)",
                    borderTopStyle: "solid",
                  }}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold text-ink">
                        ₹{prod.price || 0}
                      </span>
                      {hasDiscount && (
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-stamp-red text-paper border-[length:var(--border-w-sm)] border-solid border-ink shadow-[2px_2px_0_0_var(--color-ink)] -rotate-3">
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
                  <div className="flex items-center font-mono text-ink/40 text-xs font-semibold">
                    <Eye className="w-4 h-4 mr-1.5" />
                    {prod.views || 0}
                  </div>
                </BrutalCardFooter>
              </BrutalCard>
            </Link>
          );
        })}
      </div>

      {/* === FOOTER BUTTON === */}
      <div className="flex justify-center mt-10 md:mt-12">
        <Link to="/buy">
          <button className="flex items-center px-6 py-3 font-body font-bold text-sm md:text-base brutal-block bg-paper text-ink cursor-pointer transition-all duration-120 hover:translate-y-0.5"
            style={{
              border: "var(--border-w) solid var(--color-ink)",
              borderRadius: "var(--brutal-radius)",
            }}
          >
            View All Products{" "}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>

    </section>
  );
};

export default RecentViewedSection;