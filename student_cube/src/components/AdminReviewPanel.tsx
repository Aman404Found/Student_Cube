import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  X,
  Video,
  ExternalLink,
  MapPin,
  Tag,
  User,
  Calendar,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { getProductImageUrl } from "../utils/productImages";
import type { ProductImageValue } from "../utils/productImages";
import { BrutalLoader } from "../components/ui/brutal-loader";

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
const ADMIN_PAGE_SIZE = 20;

interface PendingProduct {
  _id: string;
  name?: string;
  title?: string;
  category: string;
  condition: string;
  price: number;
  originalPrice?: number;
  location?: string;
  college?: string;
  description: string;
  images: ProductImageValue[];
  video?: string;
  videoProof?: string;
  appliedPromoCode?: string;
  status?: string;
  views?: number;
  createdAt: string;
  seller?: {
    name?: string;
    username?: string;
    email?: string;
    mobileNumber?: string;
  };
}

const AdminReviewPanel = () => {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(
    null,
  );
  const [rejectionProduct, setRejectionProduct] =
    useState<PendingProduct | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const getSellerDisplayName = (seller?: PendingProduct["seller"]) =>
    seller?.name || seller?.username || seller?.email || "Unknown";

  const getVideoProofUrl = (video?: string) => {
    if (!video) return "";
    return video.startsWith("http")
      ? video
      : `${SERVER_URL}/${video.replace(/\\/g, "/")}`;
  };

  const fetchPending = useCallback(
    async (pageToLoad: number, replace = false) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const url = `${BACKEND_URL}/products/admin/pending?page=${pageToLoad}&limit=${ADMIN_PAGE_SIZE}&t=${new Date().getTime()}`;
        const token = localStorage.getItem("token");
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        const nextProducts = response.data.data || [];
        setProducts((current) =>
          replace ? nextProducts : [...current, ...nextProducts],
        );
        setPage(pageToLoad);
        setHasMore(Boolean(response.data.pagination?.hasMore));
      } catch (error) {
        console.error("Pending products lane me error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
  const timeoutId = setTimeout(() => {
    fetchPending(1, true);
  }, 0);

  return () => clearTimeout(timeoutId);
}, [fetchPending]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchPending(page + 1);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPending, hasMore, loading, loadingMore, page]);

  useEffect(() => {
  if (!loading && !loadingMore && products.length === 0 && hasMore) {
    const timeoutId = setTimeout(() => {
      fetchPending(page + 1);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }
}, [fetchPending, hasMore, loading, loadingMore, page, products.length]);

  const handleStatusUpdate = async (
    id: string,
    newStatus: "approved" | "rejected",
    message = "",
  ) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BACKEND_URL}/products/admin/status/${id}`,
        {
          status: newStatus,
          rejectionMessage: message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setProducts((current) => current.filter((p) => p._id !== id));
      if (selectedProduct?._id === id) {
        setSelectedProduct(null);
      }
      if (rejectionProduct?._id === id) {
        setRejectionProduct(null);
        setRejectionMessage("");
      }
      toast.success(
        `Product ${newStatus === "approved" ? "Approved ✅" : "Rejected ❌"} successfully!`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Error updating status");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (product: PendingProduct) => {
    setRejectionProduct(product);
    setRejectionMessage("");
  };

  const submitRejection = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedMessage = rejectionMessage.trim();
    if (!rejectionProduct || !trimmedMessage) {
      toast.error("Please provide a rejection message");
      return;
    }

    handleStatusUpdate(rejectionProduct._id, "rejected", trimmedMessage);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BrutalLoader size="sm" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-paper brutal-block text-ink">
        <p className="text-lg font-display font-bold uppercase tracking-tight">
          All clear! No pending items to review.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6">
        {products.map((prod) => (
          <div
            key={prod._id}
            onClick={() => setSelectedProduct(prod)}
            className="bg-paper brutal-block overflow-hidden p-6 flex flex-col md:flex-row gap-6 hover:bg-highlighter/20 transition-colors cursor-pointer"
          >
            <div className="w-full md:w-48 h-48 bg-paper-blue overflow-hidden shrink-0 relative border-[var(--border-w)] border-ink" style={{ borderRadius: 'var(--radius)' }}>
              {prod.images && prod.images.length > 0 && prod.images[0] ? (
                <img
                  src={getProductImageUrl(prod.images[0])}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                  No Image
                </div>
              )}
              <span className="absolute bottom-2 left-2 right-2 bg-paper text-ledger-blue text-[10px] font-bold px-2 py-0.5 border-[var(--border-w-sm)] border-ink uppercase tracking-wider" style={{ borderRadius: 'var(--radius)' }}>
                {prod.category}
              </span>
            </div>

            <div className="grow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-display uppercase font-black text-ink tracking-tight">
                    {prod.name || prod.title}
                  </h3>
                  <span className="bg-highlighter text-ink text-xs font-bold px-3 py-1 border-[var(--border-w-sm)] border-ink uppercase" style={{ borderRadius: 'var(--radius)' }}>
                    {prod.condition}
                  </span>
                </div>
                <p className="text-ink/80 text-sm line-clamp-3 mb-4 font-body">
                  {prod.description}
                </p>
                <div className="flex gap-4 text-xs text-ink/70 font-bold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{" "}
                    {prod.location || prod.college}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Seller:{" "}
                    {getSellerDisplayName(prod.seller)}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-mono font-bold text-ink mt-2">
                ₹{prod.price ? prod.price.toLocaleString("en-IN") : 0}
              </div>
            </div>

            <div className="w-full md:w-64 border-t-[var(--border-w)] md:border-t-0 md:border-l-[var(--border-w)] border-ink/20 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider mb-2">
                  Video Verification
                </h4>
                {prod.video || prod.videoProof ? (
                  <a
                    href={getVideoProofUrl(prod.video || prod.videoProof)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs font-bold text-paper bg-ledger-blue brutal-block-sm hover:bg-ledger-blue/90 transition-colors w-fit"
                  >
                    <Video className="w-4 h-4" /> Watch Proof{" "}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <div className="text-xs font-bold text-ink bg-paper-blue brutal-block-sm w-fit">
                    No Video Proof
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={actionLoading === prod._id}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleStatusUpdate(prod._id, "approved");
                  }}
                  className="flex-1 bg-campus-green text-ink hover:bg-campus-green/90 font-bold py-3 brutal-block-sm flex items-center justify-center transition-all disabled:opacity-60"
                >
                  <Check className="w-4 h-4 text-ink" strokeWidth={3} />
                </button>
                <button
                  disabled={actionLoading === prod._id}
                  onClick={(event) => {
                    event.stopPropagation();
                    openRejectDialog(prod);
                  }}
                  className="flex-1 bg-stamp-red text-paper hover:bg-stamp-red/90 font-bold py-3 brutal-block-sm flex items-center justify-center transition-all disabled:opacity-60"
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length > 0 && (
        <div className="flex justify-center mt-10 mb-4">
          {hasMore ? (
            <div
              ref={loadMoreRef}
              className="flex items-center gap-3 text-slate-400 text-sm font-bold py-4"
            >
              <BrutalLoader size="sm" />
              {loadingMore
                ? "Loading more pending products..."
                : "Scroll for more pending products"}
            </div>
          ) : (
            <p className="text-slate-400 text-sm font-bold">
              No more pending products
            </p>
          )}
        </div>
      )}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-paper w-full max-w-5xl max-h-[90vh] overflow-y-auto brutal-block"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-paper border-b-[var(--border-w)] border-ink px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-bold text-ledger-blue uppercase tracking-wider">
                  Pending Product Review
                </p>
                <h2 className="text-2xl font-display uppercase font-black text-ink tracking-tight">
                  {selectedProduct.name || selectedProduct.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="h-10 w-10 bg-paper-blue brutal-block-sm flex items-center justify-center transition-colors hover:bg-highlighter"
              >
                <X className="w-5 h-5 text-ink" strokeWidth={3} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedProduct.images?.length ? (
                    selectedProduct.images.map((image, index) => (
                      <a
                        key={index}
                        href={getProductImageUrl(image)}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square brutal-block-sm overflow-hidden bg-paper-blue block"
                      >
                        <img
                          src={getProductImageUrl(image)}
                          alt={`${selectedProduct.title || selectedProduct.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))
                  ) : (
                    <div className="col-span-full h-48 brutal-block-sm bg-paper-blue flex flex-col items-center justify-center text-ink/50">
                      <ImageIcon className="w-8 h-8 mb-2" />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        No images uploaded
                      </span>
                    </div>
                  )}
                </div>

                <section className="brutal-block-sm bg-paper p-4">
                  <h3 className="text-sm font-display font-black text-ink uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-ink/80 whitespace-pre-line leading-6 font-body">
                    {selectedProduct.description || "No description provided."}
                  </p>
                </section>
              </div>

              <div className="space-y-4">
                <section className="brutal-block-sm bg-paper p-4">
                  <h3 className="text-sm font-display font-black text-ink uppercase tracking-wider mb-3">
                    Product Info
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <Detail label="Product ID" value={selectedProduct._id} />
                    <Detail
                      label="Status"
                      value={selectedProduct.status || "pending"}
                    />
                    <Detail label="Category" value={selectedProduct.category} />
                    <Detail
                      label="Condition"
                      value={selectedProduct.condition}
                    />
                    <Detail
                      label="Selling Price"
                      value={`₹${selectedProduct.price?.toLocaleString("en-IN") || 0}`}
                    />
                    <Detail
                      label="Original Price"
                      value={
                        selectedProduct.originalPrice
                          ? `₹${selectedProduct.originalPrice.toLocaleString("en-IN")}`
                          : "Not provided"
                      }
                    />
                    <Detail
                      label="College"
                      value={
                        selectedProduct.college ||
                        selectedProduct.location ||
                        "Not provided"
                      }
                      icon={<MapPin className="w-4 h-4" />}
                    />
                    <Detail
                      label="Views"
                      value={String(selectedProduct.views || 0)}
                      icon={<Eye className="w-4 h-4" />}
                    />
                    <Detail
                      label="Promo Code"
                      value={selectedProduct.appliedPromoCode || "Not used"}
                    />
                    <Detail
                      label="Submitted"
                      value={formatDate(selectedProduct.createdAt)}
                      icon={<Calendar className="w-4 h-4" />}
                    />
                  </div>
                </section>

                <section className="brutal-block-sm bg-paper p-4">
                  <h3 className="text-sm font-display font-black text-ink uppercase tracking-wider mb-3">
                    Seller Info
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <Detail
                      label="Seller Name"
                      value={getSellerDisplayName(selectedProduct.seller)}
                      icon={<User className="w-4 h-4" />}
                    />
                    <Detail
                      label="Seller Email"
                      value={selectedProduct.seller?.email || "Not provided"}
                    />
                    <Detail
                      label="Seller Mobile"
                      value={
                        selectedProduct.seller?.mobileNumber || "Not provided"
                      }
                    />
                  </div>
                </section>

                <section className="brutal-block-sm bg-paper p-4">
                  <h3 className="text-sm font-display font-black text-ink uppercase tracking-wider mb-3">
                    Verification
                  </h3>
                  {selectedProduct.video || selectedProduct.videoProof ? (
                    <a
                      href={getVideoProofUrl(
                        selectedProduct.video || selectedProduct.videoProof,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-paper bg-ledger-blue brutal-block-sm hover:bg-ledger-blue/90 transition"
                    >
                      <Video className="w-4 h-4" /> Watch Video Proof{" "}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="text-sm font-bold text-ink bg-paper-blue brutal-block-sm w-fit">
                      No Video Proof
                    </div>
                  )}
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    disabled={actionLoading === selectedProduct._id}
                    onClick={() =>
                      handleStatusUpdate(selectedProduct._id, "approved")
                    }
                    className="bg-campus-green hover:bg-campus-green/80 text-paper font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    disabled={actionLoading === selectedProduct._id}
                    onClick={() => openRejectDialog(selectedProduct)}
                    className="bg-stamp-red/10 text-stamp-red hover:bg-stamp-red hover:text-paper border border-stamp-red/20 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {rejectionProduct && (
        <div
          className="fixed inset-0 z-60 bg-ink/80 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => {
            setRejectionProduct(null);
            setRejectionMessage("");
          }}
        >
          <form
            onSubmit={submitRejection}
            className="bg-paper w-full max-w-lg brutal-block p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-mono font-bold text-stamp-red uppercase tracking-wider">
                  Reject Listing
                </p>
                <h3 className="text-xl font-display font-black text-ink uppercase tracking-tight">
                  {rejectionProduct.name || rejectionProduct.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectionProduct(null);
                  setRejectionMessage("");
                }}
                className="h-10 w-10 bg-paper-blue brutal-block-sm hover:bg-highlighter text-ink flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            <label className="block text-xs font-display font-black text-ink uppercase tracking-wider mb-2">
              Rejection Message
            </label>
            <textarea
              required
              rows={4}
              value={rejectionMessage}
              onChange={(event) => setRejectionMessage(event.target.value)}
              placeholder="Tell the seller what needs to be fixed before listing again."
              className="w-full brutal-block-sm bg-paper-blue px-4 py-3 text-sm text-ink font-body focus:outline-none focus:ring-2 focus:ring-ledger-blue focus:bg-paper resize-y"
            />

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectionProduct(null);
                  setRejectionMessage("");
                }}
                className="bg-paper-blue brutal-block-sm text-ink font-bold py-3 hover:bg-highlighter transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading === rejectionProduct._id}
                className="bg-stamp-red brutal-block-sm text-paper font-bold py-3 hover:bg-stamp-red/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading === rejectionProduct._id ? (
                  <BrutalLoader size="sm" />
                ) : (
                  <X className="w-4 h-4 text-paper" strokeWidth={3} />
                )}
                Reject Listing
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const Detail = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => (
  <div className="brutal-block-sm bg-paper p-3 min-w-0">
    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-ink/50 mb-1 font-mono">
      {icon}
      {label}
    </div>
    <p className="font-bold text-ink wrap-break-word">{value}</p>
  </div>
);

export default AdminReviewPanel;
