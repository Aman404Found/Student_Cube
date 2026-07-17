import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Eye,
  ShieldCheck,
  MessageCircle,
  Tag,
  Lock,
  Trash2,
  X,
  Maximize,
} from "lucide-react";
import api from "../utils/api";
import axios from "axios";
import toast from "react-hot-toast";
import { getProductImageUrl } from "../utils/productImages";
import type { ProductImageValue } from "../utils/productImages";
import { Lens } from "../components/ui/lens";
import { BrutalBadge } from "../components/ui/brutal-badge";
import { BrutalButton } from "../components/ui/brutal-button";
import { BrutalLoader } from "../components/ui/brutal-loader";

interface Product {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
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
    _id?: string;
    name?: string;
    username?: string;
  };
}

interface OfferType {
  _id: string;
  offeredPrice: number;
  offerPrice?: number;
  status: string;
  buyerIdentity?: string;
  buyerName?: string;
  campus?: string;
  createdAt?: string;
  updatedAt?: string;
  counterPrice?: number;
  paymentStatus?: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const fetchedProductIdRef = useRef<string | undefined>(undefined);

  // Seller Offer Management States
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [sellerOffers, setSellerOffers] = useState<OfferType[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<OfferType | null>(null);

  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  // EXACT OWNER CHECK LOGIC
  const currentUserId = user?._id || (user as { id?: string })?.id;

  const isOwner = Boolean(
    currentUserId &&
    currentUserId ===
      (typeof product?.seller === "string"
        ? product?.seller
        : product?.seller?._id),
  );

  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // Buyer Offer Track
  const [myOffer, setMyOffer] = useState<OfferType | null>(null);
  const isUnlocked = isOwner || myOffer?.paymentStatus === "PAID";

  useEffect(() => {
    const currentUserId = user?._id || (user as { id?: string })?.id;

    if (!isAdmin && !isOwner && currentUserId && product?._id) {
      api
        .get(`/offers/my-offer/${product._id}`)
        .then((res) => {
          setMyOffer(res.data.offer || null);
        })
        .catch((err) => console.error("Failed to load my offer", err));
    }
  }, [isAdmin, isOwner, user, product?._id]);

  useEffect(() => {
    if (isOwner && product?._id) {
      api
        .get(`/offers/product/${product._id}`)
        .then((res) => setSellerOffers(res.data.offers))
        .catch((err) => console.error("Failed to load offers", err));
    }
  }, [isOwner, product?._id]);

  useEffect(() => {
    if (product && product._id) {
      let recentProducts: Product[] = JSON.parse(
        localStorage.getItem("recentProducts") || "[]",
      );
      recentProducts = recentProducts.filter(
        (p: Product) => p._id !== product._id,
      );
      recentProducts.unshift(product);

      if (recentProducts.length > 4) {
        recentProducts.pop();
      }

      localStorage.setItem("recentProducts", JSON.stringify(recentProducts));
    }
  }, [product]);

  useEffect(() => {
    if (!id || fetchedProductIdRef.current === id) return;
    fetchedProductIdRef.current = id;

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.data);
      } catch (error) {
        console.error("Product fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [chatAlias, setChatAlias] = useState("");
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const [isAdminDeleting, setIsAdminDeleting] = useState(false);

  const requireLogin = () => {
    if (token) return true;

    toast.error("Please login to continue.");
    navigate("/getstarted");
    return false;
  };

  // Offer Submit Handler
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;

    if (!offerPrice || isNaN(Number(offerPrice))) {
      return toast.error("Please enter a valid amount!");
    }

    if (product?.price && Number(offerPrice) > Number(product.price)) {
      return toast.error("Offer cannot be more than the listing price.");
    }

    if (!myOffer?._id && !chatAlias.trim()) {
      return toast.error("Please set a chat name before sending the offer.");
    }

    setIsSubmittingOffer(true);
    try {
      const response = await api.post("/offers/make", {
        productId: product?._id,
        offerPrice: Number(offerPrice),
        chatAlias: myOffer?._id ? undefined : chatAlias.trim(),
      });

      toast.success(`⚡ ${response.data.message}`);
      setMyOffer(response.data.offer || null);
      setIsOfferModalOpen(false);
      setOfferPrice("");
      setChatAlias("");
    } catch (error) {
      console.error("Offer error:", error);

      let errorMsg = "Failed to send offer.";

      // Type-safe error handling for Axios and generic errors
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || "Failed to send offer.";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      toast.error(`❌ ${errorMsg}`);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleMarkSold = async () => {
    const confirm = window.confirm(
      "Mark this product as sold? It will show as sold out for 24 hours and buyers will not be able to make offers.",
    );
    if (!confirm) return;

    setIsMarkingSold(true);
    try {
      const res = await api.put(`/products/${product?._id}/mark-sold`);
      toast.success(res.data.message || "Product marked as sold");
      setProduct(res.data.data);
      setIsSellerModalOpen(false);
    } catch (error) {
      let errorMsg = "Failed to mark product as sold";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsMarkingSold(false);
    }
  };

  const handleAdminDeleteProduct = async () => {
    if (!product) return;

    const confirm = window.confirm(
      `Delete "${product.title || product.name}" permanently? This cannot be undone.`,
    );
    if (!confirm) return;

    setIsAdminDeleting(true);
    try {
      const res = await api.delete(`/products/admin/${product._id}`);
      toast.success(res.data.message || "Product deleted successfully.");
      navigate("/buy");
    } catch (error) {
      let errorMsg = "Failed to delete product";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsAdminDeleting(false);
    }
  };

  // 2. REJECT DEAL HANDLER
  const handleRejectOffer = async (offerId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to reject this offer?",
    );
    if (!confirm) return;

    try {
      const res = await api.put(`/offers/reject/${offerId}`);
      toast.success(`🗑️ ${res.data.message}`);
      setSellerOffers((prev) =>
        prev.map((offer) =>
          offer._id === offerId ? { ...offer, status: "rejected" } : offer,
        ),
      );
      setSelectedOffer((current) =>
        current?._id === offerId ? { ...current, status: "rejected" } : current,
      );
    } catch (error) {
      let errorMsg = "Failed to reject offer";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(`❌ ${errorMsg}`);
    }
  };

  // 3. COUNTER DEAL STATE & HANDLER
  const [isCountering, setIsCountering] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");

  const handleCounterOffer = async (offerId: string) => {
    if (!counterAmount || isNaN(Number(counterAmount))) {
      toast.error("Please enter a valid counter amount!");
      return;
    }

    try {
      const res = await api.put(`/offers/counter/${offerId}`, {
        counterPrice: Number(counterAmount),
      });
      toast.success(`🔄 ${res.data.message}`);
      const nextOffer = {
        ...res.data.offer,
        offeredPrice: res.data.offer.offerPrice,
        buyerIdentity: selectedOffer?.buyerIdentity,
        buyerName: selectedOffer?.buyerName,
        campus: selectedOffer?.campus,
      };
      setSellerOffers((prev) =>
        prev.map((offer) =>
          offer._id === offerId ? { ...offer, ...nextOffer } : offer,
        ),
      );
      setSelectedOffer((current) =>
        current?._id === offerId ? { ...current, ...nextOffer } : current,
      );
      setIsCountering(false);
      setCounterAmount("");
    } catch (error) {
      let errorMsg = "Failed to send counter offer";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const getOfferStatusLabel = (status: string) => {
    if (status === "countered") return "Countered";
    if (status === "on_hold") return "On Hold";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getOfferStatusClass = (status: string) => {
    if (status === "pending") return "bg-orange-100 text-orange-700";
    if (status === "rejected" || status === "failed" || status === "revoked")
      return "bg-rose-100 text-rose-700";
    if (status === "countered") return "bg-blue-100 text-blue-700";
    if (status === "accepted") return "bg-campus-green/20 text-campus-green";
    return "bg-paper-blue/50 text-ink/80";
  };

  // Chat / Unlock Handler
  const handleChatAction = async () => {
    if (product?.status === "SOLD_OUT") return;
    if (!requireLogin()) return;

    if (myOffer?._id) {
      navigate(`/chat/${myOffer._id}`);
    } else {
      toast("Make an offer first to start a chat.", { icon: "❗" });
      setIsOfferModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-paper">
        <BrutalLoader size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-paper-blue">
        <h2 className="text-2xl font-bold text-ink mb-4">
          Product Not Found
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-ledger-blue text-paper rounded-lg font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // 2. REJECT COUNTER OFFER HANDLER
  const handleRejectCounter = async () => {
    if (!myOffer) return;
    const confirm = window.confirm(
      "Are you sure you want to reject this counter offer?",
    );
    if (!confirm) return;

    try {
      const res = await api.put(`/offers/buyer/reject-counter/${myOffer._id}`);
      toast.success(`🗑️ ${res.data.message}`);
      setMyOffer((current) =>
        current ? { ...current, status: "failed" } : current,
      );
    } catch (error) {
      let errorMsg = "Failed to reject counter offer.";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(`❌ ${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen bg-paper font-sans pb-20 pt-28 text-ink">
      <div className="max-w-6xl mx-auto p-4 pt-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center font-mono font-bold uppercase tracking-wide text-ink/60 hover:text-ink mb-6 transition-colors brutal-focus"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
        </button>

        <div className="brutal-block flex flex-col md:flex-row bg-paper-blue overflow-hidden">
          {/* Left Side: Images Section */}
          <div className="w-full md:w-1/2 p-6 border-r border-ink/20 flex flex-col">
            {/* MAIN IMAGE WRAPPER (Clickable) */}
            <div
              onClick={() => setIsImageExpanded(true)}
              className="w-full h-[400px] bg-paper brutal-block flex items-center justify-center mb-4 relative group cursor-pointer overflow-hidden"
            >
              {product.images && product.images.length > 0 ? (
                <Lens zoomFactor={2}>
                  <img
                    src={getProductImageUrl(product.images[activeImage])}
                    alt={product.title || product.name}
                    className="w-full h-full object-contain p-2 mix-blend-multiply"
                  />
                </Lens>
              ) : (
                <div className="text-ink/60 font-medium">
                  No Image Available
                </div>
              )}

              {/* Sold Out Overlay */}
              {product.status === "SOLD_OUT" && (
                <div className="absolute inset-0 bg-ink/40 flex items-center justify-center backdrop-blur-[2px] pointer-events-none z-10">
                  <span className="bg-stamp-red text-paper text-2xl uppercase font-black px-8 py-3 rounded-xl brutal-block rotate-[-15deg] tracking-widest border-4 border-ink">
                    SOLD OUT
                  </span>
                </div>
              )}

              {/* Expand Icon Tooltip (Desktop Hover) */}
              <div className="absolute top-4 right-4 bg-paper/80 backdrop-blur-sm p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm hidden sm:block">
                <p className="text-xs font-bold text-slate-700">
                  Click to expand
                </p>
              </div>

              <div className="absolute bottom-4 right-4 z-20 bg-ink text-paper p-2.5 rounded-full brutal-block-sm group-hover:scale-110 transition-transform">
                <Maximize className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full">
              {/* THUMBNAILS */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((img, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-20 h-20 overflow-hidden border-[var(--border-w-sm)] border-solid shrink-0 transition-all bg-paper brutal-focus ${
                        activeImage === idx
                          ? "border-ink shadow-[2px_2px_0px_0px_var(--color-ink)]"
                          : "border-ink/20 opacity-70 hover:opacity-100 hover:border-ink/50"
                      }`}
                    >
                      <img
                        src={getProductImageUrl(img)}
                        alt="Thumbnail"
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Details Section */}
          <div className="w-full md:w-1/2 p-8 flex flex-col bg-paper">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ink/60 px-2 py-1 bg-paper-blue border-[var(--border-w-sm)] border-solid border-ink">
                {product.category}
              </span>
              <BrutalBadge condition={product.condition?.toLowerCase() === "like new" ? "like-new" : "good"}>
                {product.condition}
              </BrutalBadge>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink tracking-tight uppercase leading-tight mb-4">
              {product.title || product.name}
            </h1>

            <div className="flex items-end gap-3 mb-6 pb-6 border-b-[var(--border-w-sm)] border-solid border-ink/20">
              <span className="font-mono text-4xl font-black text-ink">
                ₹{product.price?.toLocaleString("en-IN")}
              </span>
              {product.originalPrice && (
                <span className="font-mono text-lg text-ink/40 line-through font-semibold mb-1">
                  ₹{product.originalPrice?.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="font-mono text-xs font-bold text-ink/60 uppercase tracking-widest mb-3">
                Description
              </h3>
              <p className="font-body text-ink leading-relaxed whitespace-pre-line font-medium text-sm sm:text-base">
                {product.description ||
                  "No description provided by the seller."}
              </p>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center p-4 bg-paper-blue brutal-block-sm">
                <MapPin className="w-8 h-8 text-ink bg-paper border-[var(--border-w-sm)] border-solid border-ink p-1.5 mr-3 shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase font-bold text-ink/60">
                    Location
                  </p>
                  <p className="font-body text-sm font-bold text-ink">
                    {product.location || product.college || "Campus"}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-paper-blue brutal-block-sm">
                <ShieldCheck className="w-8 h-8 text-ink bg-paper border-[var(--border-w-sm)] border-solid border-ink p-1.5 mr-3 shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase font-bold text-ink/60">
                    Condition
                  </p>
                  <p className="font-body text-sm font-bold text-ink">
                    {product.condition}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t-[var(--border-w-sm)] border-solid border-ink/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-6">
                {/* Avatar-Name Section*/}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 brutal-block-sm flex items-center justify-center font-display text-xl font-extrabold uppercase bg-ink text-paper shrink-0">
                    {isUnlocked ? (
                      (product.seller?.username || product.seller?.name || "S")
                        .charAt(0)
                        .toUpperCase()
                    ) : (
                      <Lock className="w-5 h-5 text-paper shrink-0" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold text-ink/60 uppercase tracking-widest">
                      Listed By
                    </p>
                    <p className="font-body text-lg font-bold text-ink truncate">
                      {isUnlocked
                        ? product.seller?.username ||
                          product.seller?.name ||
                          "Verified Student"
                        : "Hidden Student"}
                    </p>
                  </div>
                </div>

                {/* Views Time - Mobile par Horizontal & Desktop par Stacked */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 text-xs text-ink/60 font-mono font-bold bg-paper-blue sm:bg-transparent p-3 sm:p-0 brutal-block-sm sm:border-none sm:shadow-none uppercase">
                  <p className="flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1.5 text-ink shrink-0" />
                    <span>{product.views || 0} Views</span>
                  </p>
                  {/* Mobile separator dot */}
                  <div className="w-1 h-1 bg-ink sm:hidden"></div>
                  <p className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-ink shrink-0" />
                    <span>
                      Listed {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* SMART DYNAMIC ACTION PANEL */}
              <div className="flex flex-col gap-4">
                {isAdmin ? (
                  <div className="bg-paper-blue brutal-block-sm p-5 border-[var(--border-w-sm)] border-solid border-stamp-red">
                    <h3 className="font-mono text-xs font-bold text-stamp-red uppercase tracking-widest mb-3">
                      Admin Controls
                    </h3>
                    <BrutalButton
                      onClick={handleAdminDeleteProduct}
                      disabled={isAdminDeleting}
                      variant="destructive"
                      className="w-full shrink-0"
                    >
                      <Trash2 className="w-5 h-5 shrink-0" />
                      {isAdminDeleting ? "Deleting..." : "Delete Product"}
                    </BrutalButton>
                  </div>
                ) : isOwner ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <BrutalButton
                      onClick={() => setIsSellerModalOpen(true)}
                      disabled={product.status === "SOLD_OUT"}
                      variant="secondary"
                      className="w-full shrink-0"
                    >
                      <Tag className="w-5 h-5 mr-2 shrink-0" />
                      Check Offers ({sellerOffers.length})
                    </BrutalButton>
                    <BrutalButton
                      onClick={handleMarkSold}
                      disabled={product.status === "SOLD_OUT" || isMarkingSold}
                      variant="primary"
                      className="w-full shrink-0 !bg-campus-green"
                    >
                      {isMarkingSold
                        ? "Marking..."
                        : product.status === "SOLD_OUT"
                          ? "Already Sold"
                          : "Mark as Sold"}
                    </BrutalButton>
                  </div>
                ) : product.status === "SOLD_OUT" ? (
                  <div className="bg-paper brutal-block-sm p-5 text-center border-[var(--border-w-sm)] border-solid border-stamp-red">
                    <h3 className="font-display text-xl font-extrabold text-stamp-red uppercase tracking-wide">
                      Sold Out
                    </h3>
                    <p className="font-mono text-sm font-semibold text-stamp-red/80 mt-1 uppercase">
                      This product is no longer accepting offers.
                    </p>
                  </div>
                ) : !isOwner && myOffer?.status === "countered" ? (
                  <div className="bg-paper-blue brutal-block-sm p-6 text-center border-[var(--border-w-sm)] border-solid border-ledger-blue animate-in fade-in duration-300">
                    <h3 className="font-display text-xl font-extrabold text-ledger-blue uppercase tracking-widest mb-2">
                      Seller Countered! 🔄
                    </h3>
                    <p className="font-mono text-sm font-bold text-ink mb-4 uppercase">
                      New Demand:{" "}
                      <span className="text-3xl text-ledger-blue block mt-1">
                        ₹{myOffer.counterPrice}
                      </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <BrutalButton
                        onClick={handleChatAction}
                        variant="primary"
                        className="flex-1 shrink-0 !bg-ledger-blue"
                      >
                        Open Chat
                      </BrutalButton>
                      <BrutalButton
                        onClick={handleRejectCounter}
                        variant="secondary"
                        className="flex-1 shrink-0 !text-stamp-red !border-stamp-red hover:!bg-stamp-red hover:!text-paper"
                      >
                        Reject
                      </BrutalButton>
                    </div>
                  </div>
                ) : (
                  /* 4. Normal Default Buttons (Chat & Make Offer) */
                  <div className="flex flex-col sm:flex-row gap-4">
                    {!isOwner && (
                      <BrutalButton
                        onClick={handleChatAction}
                        disabled={product.status !== "AVAILABLE"}
                        variant={myOffer?._id ? "primary" : "secondary"}
                        className={`flex-1 shrink-0 ${myOffer?._id ? "!bg-ledger-blue" : ""}`}
                      >
                        {myOffer?._id ? (
                          <>
                            <MessageCircle className="w-5 h-5 mr-2 shrink-0" />{" "}
                            Open Chat
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 mr-2 shrink-0" /> Offer to Chat
                          </>
                        )}
                      </BrutalButton>
                    )}

                    {/* Offer Button */}
                    <BrutalButton
                      onClick={() => {
                        if (isOwner) {
                          setIsSellerModalOpen(true);
                        } else if (requireLogin()) {
                          setIsOfferModalOpen(true);
                        }
                      }}
                      disabled={
                        product.status !== "AVAILABLE" ||
                        (!isOwner &&
                          (myOffer?.status === "pending" ||
                            myOffer?.status === "on_hold"))
                      }
                      variant="primary"
                      className="flex-1 shrink-0"
                    >
                      <Tag className="w-5 h-5 mr-2 shrink-0" />
                      {isOwner
                        ? `Check Offers (${sellerOffers.length})`
                        : myOffer?.status === "pending"
                          ? `Offer Sent (₹${myOffer.offeredPrice || myOffer.offerPrice})`
                          : myOffer?.status === "on_hold"
                            ? "Waitlist"
                            : "Make Offer"}
                    </BrutalButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Make an Offer Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper rounded-3xl brutal-block w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-ink bg-paper-blue">
              <h3 className="text-xl font-extrabold text-ink">
                Make an Offer
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Current Price:{" "}
                <span className="text-blue-600">
                  ₹{product?.price?.toLocaleString("en-IN")}
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmitOffer} className="p-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Your Price
              </label>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/60 font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  max={product?.price}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="e.g. 450"
                  className="w-full pl-8 pr-4 py-3 bg-paper-blue border border-ink rounded-xl text-lg font-bold text-ink focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:font-medium placeholder:text-slate-300"
                />
              </div>

              {!myOffer?._id && (
                <>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Chat Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={chatAlias}
                    onChange={(e) => setChatAlias(e.target.value)}
                    placeholder="e.g. Calculator deal"
                    className="w-full px-4 py-3 mb-6 bg-paper-blue border border-ink rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:font-medium placeholder:text-slate-300"
                  />
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="flex-1 py-3 bg-paper border border-ink text-ink/80 rounded-xl font-bold text-sm hover:bg-paper-blue transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOffer}
                  className="flex-1 py-3 bg-ink hover:bg-ink disabled:bg-slate-400 text-paper rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center"
                >
                  {isSubmittingOffer ? "Sending..." : "Send Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELLER'S SPLIT-SCREEN DASHBOARD MODAL */}
      {isSellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md animate-in fade-in duration-200 font-sans">
          <div className="bg-paper rounded-3xl brutal-block w-full max-w-4xl h-150 overflow-hidden flex animate-in zoom-in-95 duration-200">
            {/* ⬅️ LEFT SIDE: Anonymous Request List */}
            <div className="w-1/3 bg-paper-blue border-r border-ink flex flex-col">
              <div className="p-5 border-b border-ink bg-paper">
                <h3 className="font-extrabold text-ink text-lg">
                  Active Offers
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {sellerOffers.length} students bargaining
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sellerOffers.length === 0 ? (
                  <p className="text-center text-ink/60 text-sm font-semibold mt-10">
                    No offers yet.
                  </p>
                ) : (
                  sellerOffers.map((offer) => (
                    <button
                      key={offer._id}
                      onClick={() => {
                        setSelectedOffer(offer);
                        setIsCountering(false);
                        setCounterAmount("");
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedOffer?._id === offer._id ? "border-blue-600 bg-blue-50 shadow-sm" : "border-transparent bg-paper hover:border-ink hover:shadow-sm"}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-ink text-sm">
                          Student #{offer._id.slice(-4).toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${getOfferStatusClass(offer.status)}`}
                        >
                          {getOfferStatusLabel(offer.status)}
                        </span>
                      </div>
                      <p className="text-lg font-black text-blue-600">
                        ₹{offer.offeredPrice}
                      </p>
                      {offer.counterPrice ? (
                        <p className="text-xs font-bold text-slate-500 mt-1">
                          Your counter: ₹
                          {offer.counterPrice.toLocaleString("en-IN")}
                        </p>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ➡️ RIGHT SIDE: Live Action Panel */}
            <div className="w-2/3 bg-paper flex flex-col relative">
              <button
                onClick={() => setIsSellerModalOpen(false)}
                className="absolute top-5 right-5 text-ink/60 hover:text-ink bg-paper-blue/50 p-2 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>

              {selectedOffer ? (
                <div className="p-10 flex flex-col h-full justify-center">
                  <div className="mb-8">
                    <p className="text-sm font-bold text-ink/60 uppercase tracking-wider mb-2">
                      Offer From
                    </p>
                    <h2 className="text-3xl font-black text-ink">
                      Student #{selectedOffer._id.slice(-4).toUpperCase()}
                    </h2>
                  </div>

                  <div className="bg-paper-blue p-6 rounded-2xl border border-ink mb-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-500 mb-1">
                          They are offering:
                        </p>
                        <p className="text-6xl font-black text-green-500">
                          ₹{selectedOffer.offeredPrice}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-black uppercase px-3 py-1.5 rounded-full ${getOfferStatusClass(selectedOffer.status)}`}
                      >
                        {getOfferStatusLabel(selectedOffer.status)}
                      </span>
                    </div>
                    {selectedOffer.counterPrice ? (
                      <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-wider text-blue-500">
                          Your Counter
                        </p>
                        <p className="text-2xl font-black text-blue-700">
                          ₹{selectedOffer.counterPrice.toLocaleString("en-IN")}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* THE ACTION BUTTONS */}
                  {!isCountering ? (
                    <>
                      {selectedOffer.status === "pending" ? (
                        <div className="grid grid-cols-1 gap-4 mb-4">
                          <button
                            onClick={() => handleRejectOffer(selectedOffer._id)}
                            className="py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all text-lg border border-red-100"
                          >
                            Reject Offer
                          </button>
                        </div>
                      ) : selectedOffer.status === "rejected" ? (
                        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-center text-sm font-black uppercase tracking-wider text-rose-700">
                          Rejected
                        </div>
                      ) : null}
                      {["pending", "rejected", "countered"].includes(
                        selectedOffer.status,
                      ) ? (
                        <button
                          onClick={() => setIsCountering(true)}
                          className="py-4 w-full bg-ink hover:bg-ink text-paper font-bold rounded-xl shadow-lg transition-all text-lg"
                        >
                          {selectedOffer.counterPrice
                            ? "Update Counter Offer"
                            : "Send Counter Offer"}
                        </button>
                      ) : null}
                    </>
                  ) : (
                    /* COUNTER OFFER INPUT UI */
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Your Demand
                      </label>
                      <div className="relative mb-4">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/60 font-bold text-lg">
                          ₹
                        </span>
                        <input
                          type="number"
                          autoFocus
                          value={counterAmount}
                          onChange={(e) => setCounterAmount(e.target.value)}
                          placeholder="e.g. 50"
                          className="w-full pl-8 pr-4 py-3 bg-paper-blue border border-ink rounded-xl text-lg font-bold text-ink focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsCountering(false)}
                          className="flex-1 py-3 bg-paper border border-ink text-ink/80 rounded-xl font-bold hover:bg-paper-blue transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCounterOffer(selectedOffer._id)}
                          className="flex-1 py-3 bg-ledger-blue hover:bg-ledger-blue/90 text-paper rounded-xl font-bold shadow-md"
                        >
                          Send Counter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-ink/60">
                  <Tag className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-semibold">
                    Select an offer from the list
                  </p>
                  <p className="text-sm">
                    Review bids, reject, counter, or mark the product sold.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔍 FULL SCREEN IMAGE EXPAND MODAL */}
      {isImageExpanded && product?.images && product.images.length > 0 && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-ink/95 backdrop-blur-sm p-4 sm:p-10 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setIsImageExpanded(false)} // Background pe click karne se band hoga
        >
          {/* Close Button */}
          <button
            onClick={() => setIsImageExpanded(false)}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-paper/70 hover:text-paper bg-paper/10 hover:bg-paper/20 p-3 rounded-full transition-all z-110"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Expanded Image */}
          <div className="relative w-full h-full max-w-6xl max-h-screen flex items-center justify-center">
            <img
              src={getProductImageUrl(product.images[activeImage])}
              alt={product.title || "Expanded view"}
              className="max-w-full max-h-full object-contain cursor-default select-none brutal-block"
              onClick={(e) => e.stopPropagation()} // Image pe click karne se band NAHI hoga
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
