import { useEffect, useState } from "react";
import {
  Camera,
  Info,
  CheckCircle2,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { BrutalButton } from "../components/ui/brutal-button";
import { BrutalLoader } from "../components/ui/brutal-loader";
import CustomSelect from "../components/ui/CustomSelect";

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

export interface PhotoItem {
  id: string;
  file: File;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  uploadedData?: UploadedImage;
  errorMsg?: string;
}

interface ImagePreviewProps {
  item: PhotoItem;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRetry: () => void;
}

const ImagePreview = ({
  item,
  index,
  total,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onRetry,
}: ImagePreviewProps) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(item.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [item.file]);

  return (
    <div className="w-32 h-32 bg-paper brutal-block-sm overflow-hidden relative group p-1">
      <div className="w-full h-full border border-ink relative overflow-hidden bg-paper">
        {url && (
          <img
            src={url}
            alt="Upload preview"
            className="w-full h-full object-cover"
          />
        )}

        {/* Upload Progress Overlay */}
        {item.status === "uploading" && (
          <div className="absolute inset-0 bg-ink/70 flex flex-col items-center justify-center p-2 text-paper z-10">
            <span className="font-mono text-xs font-bold mb-1">{item.progress}%</span>
            <div className="w-full bg-paper/30 h-2 border border-paper overflow-hidden">
              <div
                className="bg-campus-green h-full transition-all duration-150"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {item.status === "success" && (
          <div className="absolute top-1 left-1 bg-campus-green text-paper p-0.5 border border-ink shadow-[1px_1px_0px_0px_var(--color-ink)] z-10">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Error / Retry Overlay */}
        {item.status === "error" && (
          <div className="absolute inset-0 bg-stamp-red/90 flex flex-col items-center justify-center p-1 text-paper text-center z-10">
            <span className="font-mono text-[10px] font-bold mb-1 uppercase">Upload Failed</span>
            <button
              type="button"
              onClick={onRetry}
              className="px-2 py-1 bg-paper text-stamp-red font-mono text-[10px] font-bold border border-ink shadow-[1px_1px_0px_0px_var(--color-ink)] flex items-center gap-1 hover:bg-paper-blue cursor-pointer"
            >
              <RotateCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Remove Button */}
        {item.status !== "uploading" && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 bg-stamp-red text-paper p-1 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-y-px z-20"
            title="Remove photo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Reorder Controls */}
        {item.status !== "uploading" && total > 1 && (
          <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {index > 0 ? (
              <button
                type="button"
                onClick={onMoveLeft}
                className="bg-paper text-ink p-1 border border-ink shadow-[1px_1px_0px_0px_var(--color-ink)] hover:bg-ledger-blue hover:text-paper"
                title="Move left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            ) : <div />}
            {index < total - 1 ? (
              <button
                type="button"
                onClick={onMoveRight}
                className="bg-paper text-ink p-1 border border-ink shadow-[1px_1px_0px_0px_var(--color-ink)] hover:bg-ledger-blue hover:text-paper"
                title="Move right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : <div />}
          </div>
        )}
      </div>
    </div>
  );
};

const Sell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
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

  const validatePhotos = (items: PhotoItem[]) => {
    if (items.length === 0) {
      return "Please upload at least 1 product photo.";
    }

    if (items.length > MAX_IMAGES) {
      return "You can only upload up to 4 photos.";
    }

    const invalidType = items.find(
      (item) => !ALLOWED_IMAGE_TYPES.includes(item.file.type),
    );
    if (invalidType) {
      return "Only png, jpg, and jpeg images are allowed.";
    }

    const oversized = items.find((item) => item.file.size > MAX_IMAGE_BYTES);
    if (oversized) {
      return "No image should be more than 10 MB.";
    }

    return "";
  };

  const uploadSinglePhoto = async (
    item: PhotoItem,
    signature: CloudinarySignature,
  ): Promise<UploadedImage> => {
    if (item.status === "success" && item.uploadedData) {
      return item.uploadedData;
    }

    setPhotos((prev) =>
      prev.map((p) =>
        p.id === item.id
          ? { ...p, status: "uploading", progress: 0, errorMsg: undefined }
          : p,
      ),
    );

    const formData = new FormData();
    formData.append("file", item.file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", String(signature.timestamp));
    formData.append("folder", signature.folder);
    formData.append("signature", signature.signature);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setPhotos((prev) =>
                prev.map((p) =>
                  p.id === item.id ? { ...p, progress: percent } : p,
                ),
              );
            }
          },
        },
      );

      const uploaded: UploadedImage = {
        publicId: response.data.public_id,
        url: response.data.secure_url,
        bytes: response.data.bytes,
        format: response.data.format,
      };

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, status: "success", progress: 100, uploadedData: uploaded }
            : p,
        ),
      );

      return uploaded;
    } catch (err) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, status: "error", errorMsg: "Upload failed" }
            : p,
        ),
      );
      throw err;
    }
  };

  const movePhotoLeft = (index: number) => {
    if (index <= 0) return;
    setPhotos((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const movePhotoRight = (index: number) => {
    if (index >= photos.length - 1) return;
    setPhotos((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const handleRetryPhoto = async (item: PhotoItem) => {
    try {
      const signatureRes = await api.post("/products/upload-signature");
      await uploadSinglePhoto(item, signatureRes.data.data);
      toast.success("Image uploaded successfully!");
    } catch {
      toast.error("Failed to upload image.");
    }
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
      const newItems: PhotoItem[] = selectedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "idle",
      }));

      const nextPhotos = [...photos, ...newItems];
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

  const handleSubmit = async (e: React.SubmitEvent) => {
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
        photos.map((item) =>
          uploadSinglePhoto(item, signatureRes.data.data),
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
        await queryClient.invalidateQueries({ queryKey: ['products'] });

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
              await queryClient.invalidateQueries({ queryKey: ['products'] });

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
            className="w-full bg-ledger-blue"
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
            className={`m-6 p-4 text-sm font-bold font-mono uppercase tracking-wide text-center border-[--border-w-sm] border-solid ${
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
              {photos.map((item, index) => (
                <ImagePreview
                  key={item.id}
                  item={item}
                  index={index}
                  total={photos.length}
                  onRemove={() =>
                    setPhotos(photos.filter((_, i) => i !== index))
                  }
                  onMoveLeft={() => movePhotoLeft(index)}
                  onMoveRight={() => movePhotoRight(index)}
                  onRetry={() => handleRetryPhoto(item)}
                />
              ))}

              {photos.length < 4 && (
                <>
                  <label className="hidden md:flex w-32 h-32 bg-paper border-ink flex-col items-center justify-center text-ink/60 hover:bg-ledger-blue hover:text-paper hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-ink)] transition-all cursor-pointer relative overflow-hidden group">
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
                    <label className="w-32 h-32 bg-paper  border-ink flex flex-col items-center justify-center text-ink/60 hover:bg-ledger-blue hover:text-paper hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-ink)] transition-all cursor-pointer relative overflow-hidden">
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
                    <label className="w-32 h-32 bg-paper  border-ink flex flex-col items-center justify-center text-ink/60 hover:bg-ledger-blue hover:text-paper hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-ink)] transition-all cursor-pointer relative overflow-hidden">
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
              className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
            />
          </div>


          {/* Category */}
          <div>
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
                Category <span className="text-stamp-red">*</span>
              </label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                placeholder="Select category"
                options={[
                  { value: "Books & Notes", label: "Books & Notes" },
                  { value: "Calculators", label: "Calculators" },
                  { value: "Drafters & Instruments", label: "Drafters & Instruments" },
                  { value: "Aakash/Assignment Materials", label: "Aakash/Assignment Materials" },
                  { value: "Lab Coats & Uniforms", label: "Lab Coats & Uniforms" },
                  { value: "Electronics & Gadgets", label: "Electronics & Gadgets" },
                  { value: "IOT and Robotics", label: "IOT and Robotics" },
                  { value: "Others", label: "Others" },
                ]}
              />
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
                <span className="flex items-center justify-center w-12 bg-ledger-blue border-w-[var(--border-w)] border-r-0 border-ink text-paper font-mono font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-mono font-bold text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-2 uppercase tracking-widest">
                Condition <span className="text-stamp-red">*</span>
              </label>
              <CustomSelect
                value={condition}
                onChange={setCondition}
                placeholder="Select condition"
                options={[
                  { value: "New", label: "New" },
                  { value: "Like New", label: "Like New" },
                  { value: "Good", label: "Good" },
                  { value: "Fair", label: "Fair" },
                ]}
              />
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
                <span className="flex items-center justify-center w-12 bg-ledger-blue border-w-[var(--border-w)] border-r-0 border-ink text-paper font-mono font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="Original MRP"
                  className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-mono font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
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
                  className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-mono font-bold text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40 uppercase tracking-widest"
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
              className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40 resize-y"
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
              className="w-full px-4 py-3 bg-paper border-w-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
            />
            <p className="font-body text-xs font-medium text-ink/70 mt-2">
              Add a public Google Drive file link for a product video. Make sure
              sharing is set to anyone with the link can view.
            </p>
          </div>

          {/* Info Alert (Updated logic to ₹9) */}
          <div className="bg-teal-200 p-4 flex gap-3 items-start ">
            <Info className="w-5 h-5 text-[#0A0A0A] shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-sm font-bold text-[#0A0A0A] mb-1 uppercase tracking-widest">
                Listing Fee: ₹9
              </p>
              <p className="font-body text-xs font-medium text-[#0A0A0A]/80">
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
