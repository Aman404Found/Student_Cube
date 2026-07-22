import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_SNAP, prefersReducedMotion } from "../lib/motion";
import {
  Search,
  Home,
  ShoppingBag,
  Tag,
  MessageSquare,
  Menu,
  ShieldAlert,
  BadgeCheck,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import logo1 from "../assets/logo-1.jpeg";
import api from "../utils/api";

const searchPlaceholders = [
  "Search for second-hand Casio calculators...",
  "Looking for first-year IT books?",
  "Find engineering drawing boards & drafters...",
  "Search for cheap hostel room essentials...",
  "Buy lab coats and practical files safely...",
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: hasUnreadChats } = useQuery({
    queryKey: ['unreadChats'],
    queryFn: async () => {
      if (!user) return false;
      const res = await api.get("/chat/unread");
      return Boolean(res.data.hasUnread);
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true, // Natively handles the "focus" window event
  });

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isAmbassador = user?.role?.toLowerCase() === "ambassador";

  const { data: hasPendingProducts } = useQuery({
    queryKey: ['pendingProducts'],
    queryFn: async () => {
      if (!isAdmin) return false;
      const res = await api.get("/products/admin/pending");
      return Boolean(res.data.total > 0);
    },
    enabled: !!isAdmin,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });

  // Navbar entrance animation - ties into loader resolve
  useGSAP(() => {
    if (prefersReducedMotion()) return;

    gsap.fromTo(
      navRef.current,
      { y: -20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: EASE_SNAP, 
        delay: 0.8,
        scrollTrigger: {
          trigger: navRef.current,
          start: "top 95%",
        }
      }
    );
  }, { scope: navRef });

  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Buy", icon: ShoppingBag, path: "/buy" },
    ...(isAdmin ? [] : [{ name: "Sell", icon: Tag, path: "/sell" }]),
    { name: "Chat", icon: MessageSquare, path: "/chat" },
  ];

  useEffect(() => {
    const handleReadChange = () => {
      queryClient.invalidateQueries({ queryKey: ['unreadChats'] });
    };

    window.addEventListener("student-cube-chat-read-change", handleReadChange);
    return () => {
      window.removeEventListener("student-cube-chat-read-change", handleReadChange);
    };
  }, [queryClient]);

  // TypeScript typing added to 'e' parameter
  const handleSearchSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/buy?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      ref={navRef}
      className="relative z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-paper font-body w-full"
      style={{
        borderBottom: "var(--border-w) solid var(--color-ink)",
      }}
    >
      {/* Logo Section — same link target, restyled */}
      <Link
        to="/"
        className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 brutal-focus"
      >
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 overflow-hidden shrink-0 bg-paper"
          style={{
            border: "var(--border-w-sm) solid var(--color-ink)",
            borderRadius: "var(--brutal-radius)",
          }}
        >
          <img
            src={logo1}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight">
          <span className="text-ink">Student</span>
          <span className="text-signal-orange ml-1">Cube</span>
        </div>
      </Link>

      {/* Desktop Search Bar */}
      <div className="hidden md:flex flex-1 justify-center items-center px-4 w-full">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl">
          <div className="flex items-center gap-3">
            <div 
              className="flex-1 relative brutal-block bg-paper transition-transform duration-120"
              style={{
                border: "var(--border-w) solid var(--color-ink)",
                borderRadius: "var(--brutal-radius)",
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholders[Math.floor(Date.now() / 3000) % searchPlaceholders.length]}
                className="w-full py-2.5 pl-4 pr-12 bg-transparent text-ink placeholder-ink/40 font-body text-sm outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-signal-orange text-ink cursor-pointer transition-transform duration-120 hover:scale-105 active:scale-95"
                style={{
                  border: "var(--border-w-sm) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Desktop Navigation & Authentication */}
      <div className="hidden lg:flex items-center gap-6 lg:gap-8 text-sm font-body font-semibold text-ink">
        <div className="flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-3 xl:px-4 py-2 font-body font-bold text-sm uppercase tracking-wide brutal-focus transition-all duration-120 ${
                  isActive
                    ? "bg-highlighter text-[#0A0A0A]"
                    : "bg-paper text-ink hover:bg-highlighter hover:text-[#0A0A0A]"
                }`}
                style={{
                  border: isActive ? "var(--border-w-sm) solid var(--color-ink)" : "var(--border-w-sm) solid transparent",
                  boxShadow: isActive ? "2px 2px 0 0 var(--color-ink)" : "none",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                <span className="relative">
                  <Icon className="w-4 h-4" />
                  {item.name === "Chat" && hasUnreadChats && (
                    <span className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-stamp-red"
                      style={{
                        border: "var(--border-w-sm) solid var(--color-ink)",
                        borderRadius: "var(--brutal-radius)",
                      }}
                    />
                  )}
                </span>
                <span className="hidden xl:block">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Auth & Admin Buttons */}
        <div className="flex items-center shrink-0 gap-3">
          <ThemeToggle />
          {isAdmin && (
            <Link to="/admin" className="relative">
              <button className="flex items-center gap-2 px-4 py-2 bg-ledger-blue text-paper font-body font-bold text-sm uppercase tracking-wide brutal-focus cursor-pointer "
                style={{
                  border: "var(--border-w) solid var(--color-ink)",
                  boxShadow: "var(--shadow-off) var(--shadow-off) 0 0 var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                <ShieldAlert className="w-4 h-4 text-highlighter" />
                Admin
              </button>
              {hasPendingProducts && (
                <span className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-stamp-red z-5"
                  style={{
                    border: "var(--border-w-sm) solid var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                />
              )}
            </Link>
          )}
          {isAmbassador && (
            <Link to="/ambassador">
              <button className="flex items-center gap-2 px-4 py-2 bg-signal-orange text-ink font-body font-bold text-sm uppercase tracking-wide brutal-focus cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                style={{
                  border: "var(--border-w) solid var(--color-ink)",
                  boxShadow: "var(--shadow-off) var(--shadow-off) 0 0 var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                <BadgeCheck className="w-4 h-4" />
                Ambassador
              </button>
            </Link>
          )}

          {!user ? (
            <Link to="/getstarted">
              <button className="px-5 py-2 bg-signal-orange text-[#0A0A0A] font-body font-bold text-sm uppercase tracking-wide brutal-focus cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                style={{
                  border: "var(--border-w) solid var(--color-ink)",
                  boxShadow: "var(--shadow-off) var(--shadow-off) 0 0 var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                Get Started
              </button>
            </Link>
          ) : (
            <Link to="/profile" className="brutal-focus">
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 object-cover cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                  style={{
                    border: "var(--border-w) solid var(--color-ink)",
                    boxShadow: "3px 3px 0 0 var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-paper-blue flex items-center justify-center text-ink font-display font-bold cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                  style={{
                    border: "var(--border-w) solid var(--color-ink)",
                    boxShadow: "3px 3px 0 0 var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="lg:hidden flex items-center">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-ink bg-paper brutal-focus cursor-pointer transition-all duration-120"
          style={{
            border: "var(--border-w-sm) solid var(--color-ink)",
            boxShadow: "2px 2px 0 0 var(--color-ink)",
            borderRadius: "var(--brutal-radius)",
          }}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          className="absolute top-full left-0 w-full bg-paper lg:hidden flex flex-col p-4 gap-4"
          style={{
            borderBottom: "var(--border-w) solid var(--color-ink)",
            boxShadow: "0 var(--shadow-off) 0 0 var(--color-ink)",
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            className="md:hidden relative flex items-center w-full"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full py-2.5 pl-4 pr-12 bg-paper text-ink placeholder-ink/40 font-body text-sm brutal-block"
                style={{
                  border: "var(--border-w) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-signal-orange text-ink brutal-block cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                style={{
                  border: "var(--border-w-sm) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="flex justify-between items-center mb-2">
            <span className="font-body font-bold text-sm uppercase text-ink">Theme</span>
            <ThemeToggle />
          </div>

          {/* Mobile Links */}
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-3 font-body font-bold text-sm uppercase tracking-wide brutal-focus transition-all duration-120 ${
                    isActive
                      ? "bg-ink text-paper"
                      : "bg-paper text-ink hover:bg-highlighter hover:text-[#0A0A0A]"
                  }`}
                  style={{
                    border: "var(--border-w-sm) solid var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  <span className="relative">
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-paper" : "text-ink group-hover:text-[#0A0A0A]"}`}
                    />
                    {item.name === "Chat" && hasUnreadChats && (
                      <span className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-stamp-red"
                        style={{
                          border: "var(--border-w-sm) solid var(--color-ink)",
                          borderRadius: "var(--brutal-radius)",
                        }}
                      />
                    )}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Auth, Special Portals & Profile Action Buttons */}
          <div className="pt-2 flex flex-col gap-3"
            style={{ borderTop: "var(--border-w-sm) solid var(--color-ink)" }}
          >
            {isAdmin && (
              <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full relative py-3 px-4 bg-ledger-blue text-paper font-body font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                  style={{
                    border: "var(--border-w) solid var(--color-ink)",
                    boxShadow: "var(--shadow-off) var(--shadow-off) 0 0 var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  <ShieldAlert className="w-4 h-4 text-highlighter" />
                  Admin Portal
                  {hasPendingProducts && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-stamp-red"
                      style={{
                        border: "var(--border-w-sm) solid var(--color-ink)",
                        borderRadius: "var(--brutal-radius)",
                      }}
                    />
                  )}
                </button>
              </Link>
            )}
            {isAmbassador && (
              <Link to="/ambassador" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full py-3 px-4 bg-signal-orange text-ink font-body font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                  style={{
                    border: "var(--border-w) solid var(--color-ink)",
                    boxShadow: "var(--shadow-off) var(--shadow-off) 0 0 var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  <BadgeCheck className="w-4 h-4" />
                  Ambassador Dashboard
                </button>
              </Link>
            )}

            {!user ? (
              <Link to="/getstarted" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full py-3 bg-signal-orange text-ink font-body font-bold text-sm uppercase tracking-wide cursor-pointer transition-all duration-120 hover:translate-y-[-2px]"
                  style={{
                    border: "var(--border-w) solid var(--color-ink)",
                    boxShadow: "var(--shadow-off) var(--shadow-off) 0 0 var(--color-ink)",
                    borderRadius: "var(--brutal-radius)",
                  }}
                >
                  Get Started
                </button>
              </Link>
            ) : (
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-paper-blue brutal-focus transition-all duration-120"
                style={{
                  border: "var(--border-w-sm) solid var(--color-ink)",
                  borderRadius: "var(--brutal-radius)",
                }}
              >
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 object-cover"
                    style={{
                      border: "var(--border-w-sm) solid var(--color-ink)",
                      borderRadius: "var(--brutal-radius)",
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 bg-highlighter flex items-center justify-center text-[#0A0A0A] font-display font-bold"
                    style={{
                      border: "var(--border-w-sm) solid var(--color-ink)",
                      borderRadius: "var(--brutal-radius)",
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-body font-bold text-ink">{user.name}</p>
                  <p className="font-mono text-xs text-ink/50 font-medium uppercase tracking-wide">View Profile</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;