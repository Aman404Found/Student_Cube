import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  ChevronDown,
  Filter,
  MapPin,
  Eye,
  Clock,
  Laptop,
  X 
} from "lucide-react";
import api from "../utils/api";
import { useSearchParams, useNavigate } from "react-router-dom";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { getProductImageUrl } from "../utils/productImages";
import type { ProductImageValue } from "../utils/productImages";
import { ALL_COLLEGES_FILTER, COLLEGE_FILTER_OPTIONS } from "../utils/colleges";
import Footer from "../components/FooterMin";
import { BrutalCard, BrutalCardImage, BrutalCardContent, BrutalCardFooter } from "../components/ui/brutal-card";
import { BrutalBadge } from "../components/ui/brutal-badge";
import { BrutalButton } from "../components/ui/brutal-button";
import { BrutalLoader } from "../components/ui/brutal-loader";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_SNAP, prefersReducedMotion, STAGGER_GAP } from "../lib/motion";

interface Product {
  _id: string;
  name?: string;
  title?: string;
  category: string;
  condition: string;
  price: number;
  originalPrice?: number;
  location?: string;
  college?: string;
  images: ProductImageValue[];
  status?: string;
  views?: number;
  createdAt: string;
  seller?: {
    username?: string;
  };
}

const filterOptions = {
  Category: [
    "Books & Notes", "Calculators", "Drafters & Instruments",
    "Aakash/Assignment Materials", "Lab Coats & Uniforms",
    "Electronics & Gadgets", "Accessories", "Others",
  ],
  Condition: ["New", "Like New", "Good", "Fair"],
  "Price Range": [
    "Under ₹500", "₹500 - ₹1,000", "₹1,000 - ₹2,500", "Above ₹2,500",
  ],
};

const PRODUCT_PAGE_SIZE = 20;

const BrowseProducts = () => {
  // 1. DATA STATES
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // 2. URL SEARCH PARAMS 
  const [searchParams, setSearchParams] = useSearchParams();

  // Extracting current filter values from URL 
  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const selectedCollege = searchParams.get("college") || ALL_COLLEGES_FILTER;
  const selectedCategory = searchParams.get("category") || null;
  const selectedCondition = searchParams.get("condition") || null;
  const selectedPriceRange = searchParams.get("price") || null;

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

  if (searchQuery !== prevSearchQuery) {
    setSearchInput(searchQuery);
    setPrevSearchQuery(searchQuery);
  }

  useEffect(() => {
    const nextSearch = searchInput.trim();

    if (nextSearch === searchQuery) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        if (nextSearch) {
          nextParams.set("search", nextSearch);
        } else {
          nextParams.delete("search");
        }

        nextParams.delete("q");
        return nextParams;
      }, { replace: true });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchQuery, setSearchParams]);

  const fetchProducts = useCallback(async (pageToLoad: number, replace = false) => {
    if (replace) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: String(pageToLoad),
        limit: String(PRODUCT_PAGE_SIZE),
      });

      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCollege !== ALL_COLLEGES_FILTER) params.set("college", selectedCollege);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedCondition) params.set("condition", selectedCondition);
      if (selectedPriceRange) params.set("price", selectedPriceRange);

      const response = await api.get(`/products?${params.toString()}`);
      const nextProducts = response.data.data || [];

      setProducts((current) => replace ? nextProducts : [...current, ...nextProducts]);
      setPage(pageToLoad);
      setHasMore(Boolean(response.data.pagination?.hasMore));
    } catch (error) {
      console.error("Products lane mein error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, selectedCollege, selectedCategory, selectedCondition, selectedPriceRange]);

  useEffect(() => {
    const loadData = async () => {
      await fetchProducts(1, true);
    };
    
    loadData();
  }, [fetchProducts]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchProducts(page + 1);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchProducts, hasMore, loading, loadingMore, page]);

  // Step B: GSAP entrance animation for grid
  useGSAP(() => {
    if (prefersReducedMotion() || products.length === 0 || loading) return;

    gsap.fromTo(
      gridRef.current?.children || [],
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.4, 
        ease: EASE_SNAP, 
        stagger: STAGGER_GAP,
        delay: 0.1,
        overwrite: "auto",
        clearProps: "all"
      }
    );
  }, { scope: gridRef, dependencies: [loading] });

  // Helper function to update a specific URL parameter
  const updateFilterParams = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== ALL_COLLEGES_FILTER) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Handle Button Clicks
  const toggleFilter = (group: string, option: string) => {
    if (group === "Category") {
      updateFilterParams("category", selectedCategory === option ? null : option);
    }
    if (group === "Condition") {
      updateFilterParams("condition", selectedCondition === option ? null : option);
    }
    if (group === "Price Range") {
      updateFilterParams("price", selectedPriceRange === option ? null : option);
    }
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCollege !== ALL_COLLEGES_FILTER || selectedCategory || selectedCondition || selectedPriceRange;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans text-ink">
      <main className="grow max-w-7xl mx-auto w-full p-4 py-10 pt-28">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-ink tracking-tight uppercase">Browse</h2>
            <p className="font-mono text-sm sm:text-base text-ink/60 uppercase font-semibold">
              Showing {products.length} {products.length === 1 ? 'result' : 'results'} {hasActiveFilters && "(Filtered)"}
            </p>
          </div>
          <div className="w-full md:w-auto">
            <div className="relative block brutal-block-sm bg-paper h-fit">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/50" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="pl-9 pr-4 py-2 bg-transparent text-sm w-full sm:w-96 md:w-[28rem] outline-none transition-all placeholder:text-ink/40 font-mono text-ink font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* SIDEBAR FILTERS */}
          <aside className="w-full md:w-64 bg-paper brutal-block h-fit overflow-hidden">
            <div className="p-5 border-b-[var(--border-w-sm)] border-ink bg-paper flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsFiltersOpen((current) => !current)}
                className="flex flex-1 items-center justify-between gap-3 text-left md:pointer-events-none"
                aria-expanded={isFiltersOpen}
              >
                <span className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Filter className="w-5 h-5 text-blue-600 md:hidden" />
                  Filters
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform md:hidden ${
                    isFiltersOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs font-bold text-red-500 flex items-center hover:underline">
                  <X className="w-3 h-3 mr-1" /> Clear All
                </button>
              )}
            </div>

            <div className={`${isFiltersOpen ? "block" : "hidden"} md:block px-4 pb-4 md:p-6 md:pt-6`}>
              {Object.entries(filterOptions).map(([category, options]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-4">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => {
                      const isActive = 
                        (category === 'Category' && selectedCategory === option) ||
                        (category === 'Condition' && selectedCondition === option) ||
                        (category === 'Price Range' && selectedPriceRange === option);

                      return (
                        <button
                          key={option}
                          onClick={() => toggleFilter(category, option)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors brutal-focus ${
                            isActive 
                              ? "bg-ledger-blue text-paper"
                              : "text-ink/80 hover:bg-paper-blue hover:text-ink"
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* COLLEGE FILTER */}
              <div className="mb-2">
                <h4 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-4">College</h4>
                <div className="relative">
                  <select
                    value={selectedCollege}
                    onChange={(e) => updateFilterParams("college", e.target.value)}
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 text-slate-700 rounded-lg text-sm border border-slate-200 focus:ring-2 focus:ring-blue-500 appearance-none font-bold outline-none cursor-pointer"
                  >
                    <option value={ALL_COLLEGES_FILTER}>Select College</option>
                    {COLLEGE_FILTER_OPTIONS.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <BrutalLoader size="lg" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-ink/60 brutal-block bg-paper">
                <Search className="w-10 h-10 mb-3 text-ink/20" />
                <p className="font-mono font-bold uppercase tracking-wide">No products match your filters.</p>
                {hasActiveFilters && (
                  <BrutalButton onClick={clearFilters} variant="secondary" size="sm" className="mt-4">
                    Clear Filters
                  </BrutalButton>
                )}
              </div>
            ) : (
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map((prod) => (
                  <BrutalCard 
                    key={prod._id} 
                    onClick={() => navigate(`/product/${prod._id}`)}
                    className="cursor-pointer flex flex-col group"
                  >
                    <BrutalCardImage className="relative h-48 w-full bg-paper-blue flex items-center justify-center">
                      
                      {prod.status === 'RESERVED' && (
                        <div className="absolute top-3 left-3 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 z-10 brutal-block-sm">
                          Reserved
                        </div>
                      )}

                      {prod.images && prod.images.length > 0 && prod.images[0] ? (
                        <img 
                          src={getProductImageUrl(prod.images[0])} 
                          alt={prod.name || prod.title || "Product Image"} 
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            prod.status === 'RESERVED' ? 'opacity-50 grayscale' : ''
                          }`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('fallback-visible');
                          }}
                        />
                      ) : (
                        <Laptop className="w-16 h-16 text-ink/20" />
                      )}

                      {prod.status === 'SOLD_OUT' && (
                        <div className="absolute inset-0 bg-ink/40 flex items-center justify-center backdrop-blur-sm z-20">
                          <BrutalBadge condition="sold">Sold Out</BrutalBadge>
                        </div>
                      )}
                      
                      {prod.views && prod.views > 100 && prod.status !== 'SOLD_OUT' && (
                        <div className="absolute top-3 right-3 z-10 flex gap-2">
                          <BrutalBadge condition="top-viewed">Hot</BrutalBadge>
                        </div>
                      )}
                    </BrutalCardImage>

                    <BrutalCardContent className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-ink/60 px-2 py-1 bg-paper-blue border-[var(--border-w-sm)] border-solid border-ink">
                          {prod.category || "Uncategorized"}
                        </span>
                        <BrutalBadge condition={prod.condition?.toLowerCase() === "like new" ? "like-new" : "good"}>
                          {prod.condition || "Used"}
                        </BrutalBadge>
                      </div>
                      
                      <h3 className="font-body font-bold text-ink text-sm sm:text-base mb-3 line-clamp-2 leading-snug group-hover:underline">
                        {prod.name || prod.title || "Untitled Product"}
                      </h3>
                      
                      <div className="flex items-center text-xs text-ink/60 mb-3 font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-ink/40" /> 
                        {prod.location || prod.college || "Campus"}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 flex items-center justify-center font-mono font-bold text-[9px] uppercase bg-paper text-ink border-[var(--border-w-sm)] border-solid border-ink">
                          {prod.seller?.username ? prod.seller.username.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <span className="text-xs text-ink/60 font-bold">
                          {prod.seller?.username || 'Student'}
                        </span>
                      </div>
                    </BrutalCardContent>
                    
                    <BrutalCardFooter className="pt-4 mt-auto border-t-[var(--border-w-sm)] border-solid border-ink bg-paper flex justify-between items-center">
                      <div className="flex flex-col">
                        <div className="font-mono font-bold text-lg text-ink">
                            ₹{prod.price ? prod.price.toLocaleString("en-IN") : "0"}
                        </div>
                        {prod.originalPrice && (
                          <div className="text-[10px] text-ink/40 line-through font-mono">
                            ₹{prod.originalPrice.toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-ink/40 font-mono font-bold ml-auto">
                        <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {prod.views || 0}</span>
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatDate(prod.createdAt)}</span>
                      </div>
                    </BrutalCardFooter>
                  </BrutalCard>
                ))}
              </div>
            )}
            
            {!loading && products.length > 0 && (
              <div className="flex justify-center mt-12 mb-10">
                {hasMore ? (
                  <div ref={loadMoreRef} className="flex items-center gap-4 text-ink/60 font-mono text-sm font-bold py-4 uppercase tracking-wider">
                    <BrutalLoader size="sm" />
                    {loadingMore ? "Loading more..." : "Scroll for more"}
                  </div>
                ) : (
                  <p className="text-ink/40 font-mono text-sm font-bold uppercase tracking-wider">No more listings</p>
                )}
              </div>
            )}
          </div>
        <ScrollToTopButton />
        </div>
      </main>
        <Footer />
    </div>
  );
};

export default BrowseProducts;
