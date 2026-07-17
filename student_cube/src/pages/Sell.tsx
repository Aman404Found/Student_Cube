import { useEffect, useState } from "react";
import {
  Camera,
  Info,
  CheckCircle2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { BrutalButton } from "../components/ui/brutal-button";
import { BrutalLoader } from "../components/ui/brutal-loader";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const GOOGLE_DRIVE_FILE_URL_PATTERN =
  /^https:\/\/drive\.google\.com\/(?:file\/d\/[a-zA-Z0-9_-]+|open\?id=[a-zA-Z0-9_-]+|uc\?(?:export=\w+&)?id=[a-zA-Z0-9_-]+)/;

interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

interface UploadedImage {
  publicId: string;
  url: string;
  bytes: number;
  format: string;
}

const Sell = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form States
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [videoProof, setVideoProof] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [hasUsedReferCode, setHasUsedReferCode] = useState<boolean | null>(
    null,
  );
  const [tags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const canUsePromoCode = hasUsedReferCode === false;

  useEffect(() => {
    let isMounted = true;

    const fetchReferralStatus = async () => {
      try {
        const res = await api.get("/auth/me");
        if (!isMounted) return;
        setHasUsedReferCode(Boolean(res.data.user?.hasUsedReferCode));
      } catch {
        if (!isMounted) return;
        setHasUsedReferCode(false);
      }
    };

    fetchReferralStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const validatePhotos = (files: File[]) => {
    if (files.length === 0) {
      return "Please upload at least 1 product photo.";
    }

    if (files.length > MAX_IMAGES) {
      return "You can only upload up to 4 photos.";
    }

    const invalidType = files.find(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type),
    );
    if (invalidType) {
      return "Only png, jpg, and jpeg images are allowed.";
    }

    const oversized = files.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversized) {
      return "No image should be more than 10 MB.";
    }

    return "";
  };

  const uploadPhotoToCloudinary = async (
    photo: File,
    signature: CloudinarySignature,
  ) => {
    const formData = new FormData();
    formData.append("file", photo);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", String(signature.timestamp));
    formData.append("folder", signature.folder);
    formData.append("signature", signature.signature);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      formData,
    );

    return {
      publicId: response.data.public_id,
      url: response.data.secure_url,
      bytes: response.data.bytes,
      format: response.data.format,
    } satisfies UploadedImage;
  };

  const validateVideoProof = (link: string) => {
    const trimmedLink = link.trim();
    if (!trimmedLink) return "";

    try {
      const parsedUrl = new URL(trimmedLink);
      if (
        parsedUrl.protocol !== "https:" ||
        parsedUrl.hostname !== "drive.google.com"
      ) {
        return "Video proof must be a Google Drive file link.";
      }
    } catch {
      return "Please provide a valid Google Drive video link.";
    }

    if (!GOOGLE_DRIVE_FILE_URL_PATTERN.test(trimmedLink)) {
      return "Please use a Google Drive file link, not a folder or Google Docs link.";
    }

    return "";
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const nextPhotos = [...photos, ...selectedFiles];
      const validationError = validatePhotos(nextPhotos);

      if (validationError) {
        toast.error(validationError);
        e.target.value = "";
        return;
      }

      setPhotos(nextPhotos);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdmin) {
      toast.error("Admins cannot sell items.");
      return;
    }

    const validationError = validatePhotos(photos);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const videoValidationError = validateVideoProof(videoProof);
    if (videoValidationError) {
      toast.error(videoValidationError);
      return;
    }
    if (originalPrice && Number(price) >= Number(originalPrice)) {
      toast.error("Selling Price must be less than the Original Price!");
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Upload Images First (Common Step)
      const signatureRes = await api.post("/products/upload-signature");
      const uploadedImages = await Promise.all(
        photos.map((photo) =>
          uploadPhotoToCloudinary(photo, signatureRes.data.data),
        ),
      );

      const productPayload = {
        title,
        category,
        price,
        condition,
        description,
        originalPrice: originalPrice || undefined,
        videoProof: videoProof.trim() || undefined,
        appliedPromoCode: canUsePromoCode ? promoCode || undefined : undefined,
        tags,
        images: uploadedImages,
      };

      const isFreeListing = canUsePromoCode && promoCode.trim().length > 0;

      // SCENARIO 1: PROMO CODE APPLIED (FREE)
      if (isFreeListing) {
        const res = await api.post("/products", productPayload);
        setMessage({
          type: "success",
          text: res.data.message || "Product sent for verification for free!",
        });
        toast.success("Sent for FREE verification using Promo Code! 🎉");
        setHasUsedReferCode(true);
        refreshUser();

        setTimeout(() => {
          navigate("/buy");
        }, 2000);
        setLoading(false);
      }
      // SCENARIO 2: NO PROMO CODE (RAZORPAY ₹9)
      else {
        toast.loading("Initiating Payment...", { id: "payment-toast" });

        const orderRes = await api.post("/payment/listing-order");

        if (!orderRes.data || !orderRes.data.order) {
          throw new Error("Backend se Order create nahi hua!");
        }

        const order = orderRes.data.order;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "Student Cube",
          description: "Product Listing Fee",
          order_id: order.id,
          prefill: {
            name: user?.name || "Student",
            email: user?.email || "",
          },
          theme: {
            color: "#336E7A",
          },
          handler: async function (response: { razorpay_payment_id: string }) {
            try {
              toast.loading("Publishing Ad...", { id: "payment-toast" });

              const finalPayload = {
                ...productPayload,
                paymentId: response.razorpay_payment_id,
              };
              await api.post("/products", finalPayload);

              toast.success(
                "Payment Successful! Product Sent for verification. 🚀",
                { id: "payment-toast" },
              );
              setMessage({
                type: "success",
                text: "Product sent for verification!",
              });

              setTimeout(() => {
                navigate("/buy");
              }, 2000);
            } catch (err: unknown) {
              console.error(err);
              toast.error("Failed to list product after payment.", {
                id: "payment-toast",
              });
            } finally {
              setLoading(false);
            }
          },
        };

        type RazorpayInstance = {
          on: (event: string, callback: () => void) => void;
          open: () => void;
        };
        const RazorpayClass = (
          window as unknown as {
            Razorpay: new (opts: typeof options) => RazorpayInstance;
          }
        ).Razorpay;
        const rzp = new RazorpayClass(options);

        rzp.on("payment.failed", function () {
          toast.error("Payment Cancelled or Failed.", { id: "payment-toast" });
          setLoading(false);
        });

        rzp.open();
      }
    } catch (error) {
      console.error("🔥 ACTUAL CRASH ERROR:", error);

      if (axios.isAxiosError(error)) {
        const errorMsg =
          error.response?.data?.message || "Error processing your request.";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg);
      } else {
        setMessage({ type: "error", text: "An unexpected error occurred." });
      }
      toast.dismiss("payment-toast");
      setLoading(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-paper font-sans py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-paper brutal-block p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-ledger-blue text-paper brutal-block flex items-center justify-center">
            <Info className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-ink mb-2 uppercase">
            Admin selling is disabled
          </h1>
          <p className="font-body text-sm font-medium text-ink/70 mb-6">
            Admin accounts can review and manage listings, but they cannot
            create seller listings.
          </p>
          <BrutalButton
            type="button"
            onClick={() => navigate("/admin")}
            variant="primary"
            className="w-full !bg-ledger-blue"
          >
            Go to Admin Dashboard
          </BrutalButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>

      {/* Header Section */}
      <div className="max-w-3xl mx-auto text-center mb-10 relative z-10">
        <span className="inline-block px-4 py-1.5 bg-signal-orange text-paper font-mono text-xs font-bold uppercase tracking-widest mb-4 brutal-block-sm">
          Become a Seller
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-ink mb-3 tracking-tight uppercase">
          List Your Item
        </h1>
        <p className="font-body text-ink/70 font-medium text-base">
          Fill in the details to sell your college accessories
        </p>
      </div>

      {/* Form Card */}
      <div className="max-w-3xl mx-auto bg-paper-blue brutal-block overflow-hidden relative z-10">
        {message.text && (
          <div
            className={`m-6 p-4 text-sm font-bold font-mono uppercase tracking-wide text-center border-[var(--border-w-sm)] border-solid ${
              message.type === "error"
                ? "bg-paper text-stamp-red border-stamp-red shadow-[2px_2px_0px_0px_var(--color-stamp-red)]"
                : "bg-campus-green text-ink border-ink shadow-[2px_2px_0px_0px_var(--color-ink)]"
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 md:p-10 flex flex-col gap-8"
        >
          {/* Product Photos */}
          <div>
            <label className="block font-mono text-xs font-bold text-ink mb-3 uppercase tracking-widest">
              Product Photos <span className="text-stamp-red">*</span>{" "}
              <span className="text-ink/50 font-medium">(up to 4)</span>
            </label>
            <p className="font-body text-sm font-medium text-ink/70 mb-3">
              Upload 1 to 4 images only. Each image must be under 10 MB and in
              PNG, JPG, or JPEG format.
            </p>
            <div className="flex gap-4 flex-wrap">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="w-32 h-32 bg-paper brutal-block-sm overflow-hidden relative group p-1"
                >
                  <div className="w-full h-full border border-ink relative overflow-hidden">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos(photos.filter((_, i) => i !== index))
                      }
                      className="absolute top-1 right-1 bg-stamp-red text-paper p-1 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_var(--color-ink)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {photos.length < 4 && (
                <>
                  <label className="hidden md:flex w-32 h-32 bg-paper border-[var(--border-w)] border-ink flex-col items-center justify-center text-ink/60 hover:bg-ledger-blue hover:text-paper hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-ink)] transition-all cursor-pointer relative overflow-hidden group">
                    <Camera className="w-6 h-6 mb-2 transition-transform group-hover:scale-110" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest">Add</span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex md:hidden gap-3">
                    {/* Mobile - Direct Camera */}
                    <label className="w-32 h-32 bg-paper border-[var(--border-w)] border-ink flex flex-col items-center justify-center text-ink/60 hover:bg-ledger-blue hover:text-paper hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-ink)] transition-all cursor-pointer relative overflow-hidden">
                      <Camera className="w-6 h-6 mb-2" />
                      <span className="font-mono text-xs font-bold uppercase tracking-widest">Camera</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        capture="environment" 
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Mobile - Gallery */}
                    <label className="w-32 h-32 bg-paper border-[var(--border-w)] border-ink flex flex-col items-center justify-center text-ink/60 hover:bg-ledger-blue hover:text-paper hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-ink)] transition-all cursor-pointer relative overflow-hidden">
                      <ImageIcon className="w-6 h-6 mb-2" />
                      <span className="font-mono text-xs font-bold uppercase tracking-widest">Gallery</span>
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg" 
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Title */}
          <div>
            <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
              Product Title <span className="text-stamp-red">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Engineering Mathematics B.S. Grewal"
              className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
            />
          </div>


          {/* Category */}
          <div>
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
                Category <span className="text-stamp-red">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper appearance-none cursor-pointer"
                >
                  <option value="">Select category</option>
                  <option value="Books & Notes">Books & Notes</option>
                  <option value="Calculators">Calculators</option>
                  <option value="Drafters & Instruments">
                    Drafters & Instruments
                  </option>
                  <option value="Aakash/Assignment Materials">
                    Aakash/Assignment Materials
                  </option>
                  <option value="Lab Coats & Uniforms">
                    Lab Coats & Uniforms
                  </option>
                  <option value="Electronics & Gadgets">
                    Electronics & Gadgets
                  </option>
                  <option value="Accessories">Accessories</option>
                  <option value="Others">Others</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-ink"></div>
              </div>
            </div>
            {user?.college && (
              <p className="mt-2 font-mono text-[10px] font-bold text-ink/60 uppercase">
                Listing under {user.college}
              </p>
            )}
          </div>

          {/* Selling Price & Condition Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
                Selling Price (₹) <span className="text-stamp-red">*</span>
              </label>
              <div className="relative flex">
                <span className="flex items-center justify-center w-12 bg-ledger-blue border-[var(--border-w)] border-r-0 border-ink text-paper font-mono font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-mono font-bold text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
                Condition <span className="text-stamp-red">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper appearance-none cursor-pointer"
                >
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-ink"></div>
              </div>
            </div>
          </div>

          {/* Original Price & Promo Code Row */}
          <div
            className={`grid grid-cols-1 ${canUsePromoCode ? "md:grid-cols-2" : ""} gap-6`}
          >
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
                Original Price (₹){" "}
                <span className="text-ink/50 font-medium lowercase">(optional)</span>
              </label>
              <div className="relative flex">
                <span className="flex items-center justify-center w-12 bg-paper-blue border-[var(--border-w)] border-r-0 border-ink text-ink font-mono font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="Original MRP"
                  className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-mono font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
                />
              </div>
            </div>

            {/* Box will show if hasUsedReferCode is NOT true */}
            {canUsePromoCode && (
              <div>
                <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
                  Promo Code{" "}
                  <span className="text-ink/50 font-medium lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ambassador Code"
                  className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-mono font-bold text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40 uppercase tracking-widest"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
              Description <span className="text-stamp-red">*</span>
            </label>
            <p className="font-body text-xs font-medium text-ink/70 mb-3">
              Any information other than product details may result in cancellation.
            </p>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item in detail..."
              className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40 resize-y"
            ></textarea>
          </div>

          {/* Product Video */}
          <div>
            <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
              Product Video Link{" "}
              <span className="text-ink/50 font-medium lowercase">(optional)</span>
            </label>
            <input
              type="url"
              value={videoProof}
              onChange={(e) => setVideoProof(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
            />
            <p className="font-body text-xs font-medium text-ink/70 mt-2">
              Add a public Google Drive file link for a product video. Make sure
              sharing is set to anyone with the link can view.
            </p>
          </div>

          {/* Info Alert (Updated logic to ₹9) */}
          <div className="bg-highlighter brutal-block-sm p-4 flex gap-3 items-start border-[var(--border-w-sm)]">
            <Info className="w-5 h-5 text-ink shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-sm font-bold text-ink mb-1 uppercase tracking-widest">
                Listing Fee: ₹9
              </p>
              <p className="font-body text-xs font-medium text-ink/80">
                Pay ₹9 to publish your product and get it in front of buyers
                instantly.{" "}
                {canUsePromoCode && (
                  <strong className="block mt-1 uppercase font-bold text-stamp-red">
                    (Waived if Promo Code is valid!)
                  </strong>
                )}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <BrutalButton
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full py-4 mt-2"
          >
            {loading ? (
              <BrutalLoader size="sm" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Submit and Pay
              </>
            )}
          </BrutalButton>
        </form>
      </div>
    </div>
  );
};

export default Sell;
