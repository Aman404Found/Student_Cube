import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import { 
  EASE_SNAP, 
  STAGGER_GAP, 
  prefersReducedMotion 
} from "../lib/motion";
import {
  ShoppingBag,
  Tag,
  Mail,
  Phone,
  User,
  Settings,
  LogOut,
  Package,
  Clock,
  Trash2,
  CheckCircle2,
  BadgeCheck,
  MessageSquare,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { getProductImageUrl } from "../utils/productImages";
import type { ProductImageValue } from "../utils/productImages";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/FooterMin";
import { BrutalLoader } from "../components/ui/brutal-loader";

interface UserListing {
  _id: string;
  title: string;
  category: string;
  condition: string;
  college: string;
  price: number;
  originalPrice?: number;
  description: string;
  status: string;
  rejectionMessage?: string;
  images: ProductImageValue[];
  createdAt: string;
}

interface UserOffer {
  _id: string;
  offerPrice: number;
  paymentStatus: string;
  status: string;
  product?: {
    _id: string;
    title: string;
    price: number;
    images: ProductImageValue[];
    status: string;
    seller?: string;
  } | null;
  updatedAt: string;
}

const profileBadgeByRole = {
  admin: {
    label: "Admin",
    className: "bg-ledger-blue text-paper border-ink border-[var(--border-w-sm)]",
  },
  ambassador: {
    label: "Ambassador",
    className: "bg-signal-orange text-paper border-ink border-[var(--border-w-sm)]",
  },
  user: {
    label: "Verified Student",
    className: "bg-campus-green text-paper border-ink border-[var(--border-w-sm)]",
  },
};

const ProductImageFallback = () => (
  <div
    className="w-20 h-20 bg-paper-blue text-ink flex items-center justify-center shrink-0 border-[length:var(--border-w)] border-ink"
    style={{ borderRadius: "var(--radius)" }}
  >
    <Package className="w-7 h-7" />
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "listings" | "offers"
  >("overview");

  const [myListings, setMyListings] = useState<UserListing[]>([]);
  const [myOffers, setMyOffers] = useState<UserOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(
    null,
  );
  const [markingSoldId, setMarkingSoldId] = useState<string | null>(null);

  // Linter friendly Async API call
  useEffect(() => {
    const initDashboard = async () => {
      const token = localStorage.getItem("token");

      if (token && user) {
        try {
          const [listingsRes, offersRes] = await Promise.all([
            api.get("/products/my-listings"),
            api.get("/offers/my-offers"),
          ]);

          setMyListings(listingsRes.data.data);
          setMyOffers(offersRes.data.data);
        } catch (error) {
          console.error("Error fetching dashboard:", error);
          toast.error("Failed to load dashboard data");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initDashboard();
  }, [user]);

  const canDeleteListing = (status: string) =>
    ["pending", "AVAILABLE", "rejected"].includes(status);
  const canMarkListingSold = (status: string) =>
    ["AVAILABLE", "RESERVED"].includes(status);

  const getStatusClass = (status: string) => {
    if (status === "SOLD_OUT") return "bg-stamp-red text-paper border-[length:var(--border-w-sm)] border-ink";
    if (status === "RESERVED") return "bg-highlighter text-[#0A0A0A] border-[length:var(--border-w-sm)] border-ink";
    if (status === "pending")
      return "bg-paper-blue text-ink border-[var(--border-w-sm)] border-ink";
    if (status === "rejected")
      return "bg-stamp-red text-paper border-[var(--border-w-sm)] border-ink";
    return "bg-campus-green text-paper border-[var(--border-w-sm)] border-ink";
  };

  const getStatusLabel = (status: string) => {
    if (status === "pending") return "Approval Pending";
    if (status === "AVAILABLE") return "Approved";
    if (status === "RESERVED") return "Reserved";
    if (status === "SOLD_OUT") return "Sold";
    if (status === "rejected") return "Rejected";
    return status;
  };

  const handleDeleteListing = async (item: UserListing) => {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingListingId(item._id);

    try {
      const res = await api.delete(`/products/${item._id}`);
      setMyListings((items) =>
        items.filter((listing) => listing._id !== item._id),
      );
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(res.data.message || "Listing deleted successfully");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to delete listing"
        : "Failed to delete listing";
      toast.error(message);
    } finally {
      setDeletingListingId(null);
    }
  };

  const handleMarkListingSold = async (item: UserListing) => {
    const confirmed = window.confirm(
      `Mark "${item.title}" as sold? It will show as sold out for 24 hours.`,
    );
    if (!confirmed) return;

    setMarkingSoldId(item._id);

    try {
      const res = await api.put(`/products/${item._id}/mark-sold`);
      setMyListings((items) =>
        items.map((listing) =>
          listing._id === item._id ? res.data.data : listing,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(res.data.message || "Product marked as sold");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to mark product as sold"
        : "Failed to mark product as sold";
      toast.error(message);
    } finally {
      setMarkingSoldId(null);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/getstarted");
  };

  const safeRole = (user?.role?.toLowerCase() ||
    "user") as keyof typeof profileBadgeByRole;
  const profileBadge =
    profileBadgeByRole[safeRole] || profileBadgeByRole["user"];
  const isAdmin = user?.role?.toLowerCase() === "admin";

  useGSAP(
    () => {
      if (prefersReducedMotion() || loading) return;
      if (user && containerRef.current) {
        gsap.fromTo(".profile-animate",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: STAGGER_GAP,
            ease: EASE_SNAP,
            overwrite: "auto",
            clearProps: "all"
          }
        );
      }
      if (!user && guestRef.current) {
        gsap.fromTo(guestRef.current,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: EASE_SNAP,
            overwrite: "auto",
            clearProps: "all"
          }
        );
      }
    },
    { dependencies: [loading, user] }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <BrutalLoader size="sm" />
      </div>
    );
  }

  // GUEST VIEW
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-paper py-10 px-4 flex justify-center items-center">
        <div
          ref={guestRef}
          className="bg-paper p-8 brutal-block text-center max-w-md w-full"
        >
          <div
            className="w-20 h-20 bg-paper-blue text-ink border-[length:var(--border-w)] border-ink flex items-center justify-center mx-auto mb-6"
            style={{ borderRadius: "var(--radius)" }}
          >
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display uppercase tracking-tight font-bold text-ink mb-2">
            Welcome Guest
          </h2>
          <p className="font-body text-ink/70 mb-8 font-medium">
            Sign in to track your orders, manage your listings, and connect with
            buyers!
          </p>
          <Link to="/getstarted">
            <button className="w-full py-3 bg-signal-orange hover:bg-paper hover:text-signal-orange text-paper font-display uppercase font-bold tracking-tight transition-colors brutal-block-sm">
              Sign In / Register
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // REAL LOGGED-IN VIEW
  return (
    <>
      <div className="min-h-[calc(100vh-80px)] bg-paper py-10 px-4 sm:px-6 pb-20 relative z-10 overflow-hidden border-b-[length:var(--border-w)] border-ink">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
        <div
          ref={containerRef}
          className="max-w-4xl mx-auto flex flex-col gap-8 relative z-10"
        >
          {/* Profile Header Card */}
          <div className="profile-animate bg-paper brutal-block p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar Logic */}
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.username || user.name || "User"}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 object-cover border-[length:var(--border-w)] border-ink shrink-0"
                  style={{ borderRadius: "var(--radius)" }}
                />
              ) : (
                <div
                  className="w-24 h-24 bg-ledger-blue text-paper border-[length:var(--border-w)] border-ink flex items-center justify-center text-5xl font-display font-bold shrink-0 uppercase"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  {(user?.username || user?.name || "U").charAt(0)}
                </div>
              )}

              <div className="text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-1">
                  {/* FIXED: Safe Name Logic */}
                  <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-ink">
                    {user.username || user.name || "Student"}
                  </h1>

                  <span
                    className={`font-mono text-[10px] uppercase font-bold px-2.5 py-1 ${profileBadge.className}`}
                  >
                    {profileBadge.label}
                  </span>
                </div>

                {/* NAYA: Email & Mobile Block */}
                <div className="flex flex-col items-center md:items-start gap-1 mb-4 mt-2 text-ink/70 font-mono text-xs">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Mail className="w-4 h-4 text-ink/50" />
                    {user.email}
                  </p>
                  {user.mobileNumber && (
                    <p className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-4 h-4 text-ink/50" />
                      +91 {user.mobileNumber}
                    </p>
                  )}
                </div>

                {!isAdmin && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-ink font-body font-bold">
                    <span
                      className="w-2 h-2 bg-signal-orange border-[2px] border-ink"
                      style={{ borderRadius: "var(--radius)" }}
                    ></span>
                    <span>{myListings.length} items listed</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-paper text-stamp-red hover:bg-stamp-red hover:text-paper font-display uppercase font-bold tracking-tight transition-colors flex items-center gap-2 brutal-block-sm"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>

          {!isAdmin && (
            <>
              {/* Dynamic Stats Grid */}
              <div className="profile-animate grid grid-cols-2 gap-4">
                <div className="bg-paper brutal-block p-6 flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-6 h-6 text-ink mb-3" />
                  <span className="text-4xl font-display font-black text-ink mb-1">
                    {myOffers.length}
                  </span>
                  <span className="text-xs font-mono font-bold text-ink/70 uppercase tracking-wider">
                    Purchases & Offers
                  </span>
                </div>
                <div className="bg-paper brutal-block p-6 flex flex-col items-center justify-center text-center">
                  <Tag className="w-6 h-6 text-ink mb-3" />
                  <span className="text-4xl font-display font-black text-ink mb-1">
                    {myListings.length}
                  </span>
                  <span className="text-xs font-mono font-bold text-ink/70 uppercase tracking-wider">
                    My Listings
                  </span>
                </div>
              </div>

              {/* Dynamic Navigation/Tabs */}
              <div className="profile-animate bg-paper brutal-block p-2 flex overflow-x-auto gap-2 border-[var(--border-w)] border-ink">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-3 font-display uppercase font-bold text-base tracking-tight flex items-center gap-2 transition-colors shrink-0 ${activeTab === "overview" ? "bg-highlighter text-[#0A0A0A] brutal-block-sm" : "text-ink/70 hover:bg-paper-blue"}`}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <User className="w-4 h-4" /> Quick Overview
                </button>
                <button
                  onClick={() => setActiveTab("listings")}
                  className={`px-4 py-3 font-display uppercase font-bold text-base tracking-tight flex items-center gap-2 transition-colors shrink-0 ${activeTab === "listings" ? "bg-highlighter text-[#0A0A0A] brutal-block-sm" : "text-ink/70 hover:bg-paper-blue"}`}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <Tag className="w-4 h-4" /> My Listings ({myListings.length})
                </button>
                <button
                  onClick={() => setActiveTab("offers")}
                  className={`px-4 py-3 font-display uppercase font-bold text-base tracking-tight flex items-center gap-2 transition-colors shrink-0 ${activeTab === "offers" ? "bg-highlighter text-[#0A0A0A] brutal-block-sm" : "text-ink/70 hover:bg-paper-blue"}`}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <ShoppingBag className="w-4 h-4" /> My Offers & Purchases
                </button>
              </div>
            </>
          )}

          {isAdmin && (
            <div className="profile-animate bg-paper brutal-block p-6 md:p-8">
              <h2 className="text-2xl font-display uppercase font-bold text-ink mb-6 tracking-tight">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center gap-3 w-full p-4 bg-paper border-[var(--border-w)] border-ink text-ink hover:bg-highlighter brutal-block transition-colors font-body font-bold"
                >
                  <Package className="w-5 h-5 text-ink" /> Pending Products
                </button>
                <button
                  onClick={() => navigate("/admin?tab=ambassadors")}
                  className="flex items-center gap-3 w-full p-4 bg-paper border-[var(--border-w)] border-ink text-ink hover:bg-highlighter brutal-block transition-colors font-body font-bold"
                >
                  <BadgeCheck className="w-5 h-5 text-ink" /> Ambassadors
                </button>
                <button className="flex items-center gap-3 w-full p-4 bg-paper border-[var(--border-w)] border-ink text-ink/50 brutal-block font-body font-bold cursor-not-allowed">
                  <Settings className="w-5 h-5 text-ink/50" /> Account Settings
                  (Coming Soon)
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT AREA */}
          {!isAdmin && (
            <div className="mt-2">
              {/* TAB: Overview */}
              {activeTab === "overview" && (
                <div className="profile-animate bg-paper brutal-block p-6 md:p-8">
                  <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-ink mb-6">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="flex items-center gap-3 w-full p-4 bg-paper text-ink border-[var(--border-w)] border-ink hover:bg-highlighter brutal-block transition-colors font-body font-bold"
                    >
                      <Tag className="w-5 h-5 text-ink" /> Manage Listings
                    </button>
                    <button
                      onClick={() => setActiveTab("offers")}
                      className="flex items-center gap-3 w-full p-4 bg-paper text-ink border-[var(--border-w)] border-ink hover:bg-highlighter brutal-block transition-colors font-body font-bold"
                    >
                      <Package className="w-5 h-5 text-ink" /> Track My Orders
                    </button>
                    <button className="flex items-center gap-3 w-full p-4 bg-paper text-ink/50 border-[var(--border-w)] border-ink brutal-block font-body font-bold cursor-not-allowed">
                      <Settings className="w-5 h-5 text-ink/50" /> Account
                      Settings (Coming Soon)
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: My Listings */}
              {activeTab === "listings" && (
                <div className="grid gap-6">
                  {myListings.length === 0 ? (
                    <div className="bg-paper p-8 brutal-block text-center">
                      <p className="text-ink font-body font-bold">
                        You haven't listed any products yet.
                      </p>
                    </div>
                  ) : (
                    myListings.map((item) => {
                      const canDelete = canDeleteListing(item.status);
                      const canMarkSold = canMarkListingSold(item.status);

                      return (
                        <div
                          key={item._id}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/product/${item._id}`)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              navigate(`/product/${item._id}`);
                            }
                          }}
                          className="profile-animate bg-paper p-4 md:p-6 brutal-block cursor-pointer brutal-focus group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                            <img
                              src={getProductImageUrl(item.images[0])}
                              alt={item.title}
                              className="w-24 h-24 object-cover border-[var(--border-w)] border-ink shrink-0 bg-paper-blue"
                              style={{ borderRadius: "var(--radius)" }}
                            />
                            <div className="grow min-w-0">
                              <h3 className="font-display font-bold text-xl uppercase tracking-tight text-ink truncate mb-1">
                                {item.title}
                              </h3>
                              <p className="font-mono font-bold text-2xl text-ink">
                                ₹{item.price}
                              </p>
                              <p className="font-mono text-xs font-bold text-ink/70 uppercase tracking-wide mt-2">
                                {item.category} · {item.condition} ·{" "}
                                {item.college}
                              </p>
                              {item.status === "pending" && (
                                <p className="font-mono text-xs text-ledger-blue font-bold mt-3">
                                  Approval pending. You can delete this listing
                                  while it is under review.
                                </p>
                              )}
                              {item.status === "rejected" && (
                                <div className="mt-3 brutal-block-sm bg-stamp-red/10 p-3">
                                  <p className="font-display text-sm uppercase font-bold text-stamp-red">
                                    Rejected by admin
                                  </p>
                                  <p className="font-body text-sm font-medium text-ink mt-1">
                                    {item.rejectionMessage ||
                                      "No rejection message provided."}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex sm:flex-col items-start sm:items-end gap-3 justify-between sm:justify-start mt-4 sm:mt-0">
                              <span
                                className={`font-mono text-[10px] uppercase font-bold px-2.5 py-1 ${getStatusClass(item.status)}`}
                              >
                                {getStatusLabel(item.status)}
                              </span>
                              <div
                                className="flex items-center gap-3"
                                onClick={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                              >
                                {canMarkSold && (
                                  <button
                                    type="button"
                                    disabled={markingSoldId === item._id}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleMarkListingSold(item);
                                    }}
                                    className="h-10 w-10 flex items-center justify-center bg-paper text-campus-green border-[var(--border-w)] border-ink hover:bg-campus-green hover:text-paper brutal-block transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Mark as sold"
                                  >
                                    {markingSoldId === item._id ? (
                                      <BrutalLoader size="sm" />
                                    ) : (
                                      <CheckCircle2
                                        className="w-5 h-5"
                                        strokeWidth={2.5}
                                      />
                                    )}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={
                                    !canDelete || deletingListingId === item._id
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteListing(item);
                                  }}
                                  className="h-10 w-10 flex items-center justify-center bg-paper text-stamp-red border-[var(--border-w)] border-ink hover:bg-stamp-red hover:text-paper brutal-block transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={
                                    canDelete
                                      ? "Delete listing"
                                      : "Reserved or sold listings cannot be deleted"
                                  }
                                >
                                  {deletingListingId === item._id ? (
                                    <BrutalLoader size="sm" />
                                  ) : (
                                    <Trash2
                                      className="w-5 h-5"
                                      strokeWidth={2.5}
                                    />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB: My Offers */}
              {activeTab === "offers" && (
                <div className="grid gap-6">
                  {myOffers.length === 0 ? (
                    <div className="bg-paper p-8 brutal-block text-center">
                      <p className="font-body font-bold text-ink">
                        You haven't made any offers yet.
                      </p>
                    </div>
                  ) : (
                    myOffers.map((offer) => (
                      <div
                        key={offer._id}
                        className="profile-animate bg-paper p-4 md:p-6 brutal-block flex flex-col sm:flex-row sm:items-center gap-6"
                      >
                        {offer.product?.images?.[0] ? (
                          <img
                            src={getProductImageUrl(offer.product.images[0])}
                            alt={offer.product?.title || "Deleted product"}
                            className="w-24 h-24 object-cover border-[var(--border-w)] border-ink shrink-0 bg-paper-blue"
                            style={{ borderRadius: "var(--radius)" }}
                          />
                        ) : (
                          <ProductImageFallback />
                        )}
                        <div className="grow">
                          <h3 className="font-display text-xl font-bold uppercase tracking-tight text-ink mb-1">
                            {offer.product?.title || "Product Deleted"}
                          </h3>
                          {!offer.product && (
                            <p className="font-mono text-xs font-bold text-stamp-red uppercase">
                              This product is no longer available.
                            </p>
                          )}
                          <p className="font-mono text-sm font-bold text-ink/70 flex items-center gap-1 mt-2">
                            <Clock className="w-4 h-4 text-ink" /> Offered:{" "}
                            <span className="text-ink text-lg">
                              ₹{offer.offerPrice}
                            </span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-3 mt-4 sm:mt-0 flex-wrap">
                          <span
                            className={`font-mono text-[10px] uppercase font-bold px-2 py-1 border-[var(--border-w-sm)] border-ink ${
                              offer.status === "ACCEPTED"
                                ? "bg-campus-green text-paper"
                                : offer.status === "REJECTED"
                                  ? "bg-stamp-red text-paper"
                                  : "bg-highlighter text-[#0A0A0A]"
                            }`}
                          >
                            Offer: {offer.status}
                          </span>

                          {offer.paymentStatus &&
                            offer.paymentStatus !== "NONE" && (
                              <span className="font-mono text-[10px] uppercase font-bold px-2 py-1 border-[var(--border-w-sm)] border-ink bg-ledger-blue text-paper">
                                Pay: {offer.paymentStatus.replace("_", " ")}
                              </span>
                            )}

                          {/* THE NEW CHAT BUTTON (Locked behind Verified Payment) */}
                          {offer.paymentStatus === "PAID" && (
                            <button
                              onClick={() => navigate(`/chat/${offer._id}`)}
                              className="font-display text-sm uppercase font-bold bg-ink text-paper hover:bg-signal-orange hover:text-paper px-4 py-2 brutal-block-sm transition-colors flex items-center gap-2 mt-2 sm:mt-0"
                            >
                              <MessageSquare className="w-4 h-4" /> Chat
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;
