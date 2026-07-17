export interface ProductImage {
  publicId: string;
  url: string;
}

export type ProductImageValue = string | ProductImage;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export const getProductImageUrl = (image?: ProductImageValue) => {
  if (!image) return "";

  if (typeof image !== "string") {
    return image.url || "";
  }

  return image.startsWith("http")
    ? image
    : `${SERVER_URL}/${image.replace(/\\/g, "/")}`;
};
