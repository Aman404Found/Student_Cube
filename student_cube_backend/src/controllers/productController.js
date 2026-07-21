import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Offer from "../models/Offer.js";
import ReferCode from "../models/ReferCode.js";
import { markProductChatsForLifecycle } from "../utils/chatService.js";
import { hasConsumedPromoBenefit, releaseRejectedPromoUse } from "../utils/promoUsage.js";
import {
  getCollegeFilterValues,
  NAMED_COLLEGE_STORAGE_OPTIONS,
  normalizeCollegeForStorage,
  OTHER_COLLEGE,
  VALID_COLLEGE_FILTERS,
} from "../utils/colleges.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_PRODUCT_IMAGES = 4;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png"];
const LISTING_FEE = 10;
const AMBASSADOR_REFERRAL_COMMISSION = 5;
const SELLER_DELETABLE_STATUSES = ["pending", "AVAILABLE", "rejected"];
const SOLD_VISIBLE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 20;
const PUBLIC_SELLER_SELECT = "_id";
const GOOGLE_DRIVE_FILE_URL_PATTERN = /^https:\/\/drive\.google\.com\/(?:file\/d\/[a-zA-Z0-9_-]+|open\?id=[a-zA-Z0-9_-]+|uc\?(?:export=\w+&)?id=[a-zA-Z0-9_-]+)/;

const getUserUploadFolder = (userId) => `student_cube_products/users/${userId}`;
const normalizeReferCode = (code) => String(code || "").trim().toUpperCase();
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const getSearchWords = (value) => String(value || "").trim().split(/\s+/).filter(Boolean);
const formatPublicImages = (images = []) => (
  images
    .map((image) => (typeof image === "string" ? image : image?.url))
    .filter(Boolean)
);
const formatPublicProduct = (product) => {
  const data = typeof product?.toObject === "function" ? product.toObject() : { ...product };

  return {
    ...data,
    images: formatPublicImages(data.images),
  };
};

const getPaginationParams = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE, 1), DEFAULT_PAGE_SIZE);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const cleanupCloudinaryImages = async (images = [], userId) => {
  if (!userId) return;

  const uploadFolder = getUserUploadFolder(userId);
  const publicIds = images
    .map((image) => image?.publicId)
    .filter((publicId) => publicId?.startsWith(`${uploadFolder}/`))
    .filter(Boolean);

  if (publicIds.length > 0) {
    await Promise.allSettled(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
  }
};

const validateProductImages = (images, userId) => {
  if (!Array.isArray(images) || images.length === 0) {
    return "Please upload at least 1 product photo.";
  }

  if (images.length > MAX_PRODUCT_IMAGES) {
    return "You can upload up to 4 product photos only.";
  }

  const uploadFolder = getUserUploadFolder(userId);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  for (const image of images) {
    if (!image?.publicId || !image?.url) {
      return "Each image must include a publicId and url.";
    }

    if (!image.publicId.startsWith(`${uploadFolder}/`)) {
      return "One or more images do not belong to your account.";
    }

    if (
      cloudName &&
      !image.url.startsWith(`https://res.cloudinary.com/${cloudName}/`)
    ) {
      return "One or more image URLs are invalid.";
    }

    if (image.bytes && Number(image.bytes) > MAX_IMAGE_BYTES) {
      return "No image should be more than 10 MB.";
    }

    if (image.format && !ALLOWED_IMAGE_FORMATS.includes(String(image.format).toLowerCase())) {
      return "Only png, jpg, and jpeg images are allowed.";
    }
  }

  return null;
};

const validateGoogleDriveVideoLink = (videoProof) => {
  const trimmedLink = String(videoProof || "").trim();
  if (!trimmedLink) return "";

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedLink);
  } catch {
    return "Please provide a valid Google Drive video link.";
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "drive.google.com") {
    return "Video proof must be a Google Drive file link.";
  }

  if (!GOOGLE_DRIVE_FILE_URL_PATTERN.test(trimmedLink)) {
    return "Please use a Google Drive file link, not a folder or Google Docs link.";
  }

  return "";
};

export const getUploadSignature = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please login to upload images." });
    }

    if (req.user.role === "admin") {
      return res.status(403).json({ success: false, message: "Admins cannot sell items." });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = getUserUploadFolder(req.user._id);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET,
    );

    res.status(200).json({
      success: true,
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp,
        folder,
        signature,
      },
    });
  } catch (error) {
    console.error("Error creating Cloudinary upload signature:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 1. CREATE PRODUCT FUNCTION (Multiple Uses Allowed)
export const createProduct = async (req, res) => {
  const uploadedImages = Array.isArray(req.body.images) ? req.body.images : [];
  const authenticatedUserId = req.user?._id || req.user?.id;

  const fail = async (status, message) => {
    await cleanupCloudinaryImages(uploadedImages, authenticatedUserId);
    return res.status(status).json({ success: false, message });
  };

  try {
    const {
      name,
      title,
      category,
      condition,
      price,
      originalPrice,
      description,
      location,
      college,
      appliedPromoCode,
      images,
      videoProof,
    } = req.body;

    if (!req.user) {
      return fail(401, "Unauthorized! Please login to list a product.");
    }

    if (req.user.role === "admin") {
      return fail(403, "Admins cannot sell items.");
    }

    const sellerId = req.user._id || req.user.id;
    const productTitle = name || title;
    const productCollege = normalizeCollegeForStorage(req.user.collegeName || location || college);
    let listingFee = LISTING_FEE; 
    let validPromoCode;
    let validReferCode;
    
    const imageValidationError = validateProductImages(images, sellerId);
    const videoValidationError = validateGoogleDriveVideoLink(videoProof);

    if (imageValidationError) {
      return fail(400, imageValidationError);
    }

    if (videoValidationError) {
      return fail(400, videoValidationError);
    }

    if (
      !productTitle ||
      !category ||
      !condition ||
      !price ||
      !description ||
      !productCollege
    ) {
      return fail(400, "Please provide all required fields");
    }

    if (!VALID_COLLEGE_FILTERS.has(productCollege)) {
      return fail(400, "Please select a valid college from the list");
    }

    // 🎟️ Ambassador Refer Code Logic (RELAXED)
    const normalizedReferCode = normalizeReferCode(appliedPromoCode);
    if (normalizedReferCode) {
      if (await hasConsumedPromoBenefit(sellerId)) {
        return fail(400, "You can use a promo code only once.");
      }

      validReferCode = await ReferCode.findOne({ code: normalizedReferCode })
        .populate("owner", "_id name role");

      if (!validReferCode || validReferCode.owner?.role !== "ambassador") {
        return fail(400, "Invalid or expired Promo Code");
      }

      if (validReferCode.owner._id.toString() === sellerId.toString()) {
        return fail(400, "You cannot use your own refer code");
      }

      listingFee = 0;
      validPromoCode = normalizedReferCode;
    }

    // Product Creation
    const newProduct = new Product({
      title: productTitle, 
      category,
      condition,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      description,
      college: productCollege,
      images: images.map((image) => ({
        publicId: image.publicId,
        url: image.url,
      })),
      videoProof: String(videoProof || "").trim() || undefined,
      appliedPromoCode: validPromoCode,
      isPromoRewarded: false, 
      seller: sellerId, 
      status: "pending", 
    });

    await newProduct.save();

    // Product save hone ke BAAD Ambassador ka code update karo
    if (validPromoCode && validReferCode) {
      await ReferCode.updateOne(
        { _id: validReferCode._id }, 
        {
          $push: {
            referredUsers: {
              uid: sellerId,
              name: req.user.name,
              referredAt: new Date(),
              productId: newProduct._id, 
              status: 'used'            
            },
          },
        },
      );

      await User.updateOne(
        { _id: sellerId },
        {
          $set: {
            referCodeUsed: {
              code: validPromoCode,
              referCode: validReferCode._id,
              owner: validReferCode.owner._id,
              usedAt: new Date(),
            },
          },
        },
      );
    }

    res.status(201).json({
      success: true,
      message: "Product listed successfully!",
      listingFeePaid: listingFee,
      data: newProduct,
    });

  } catch (error) {
    console.error("🔥 Error saving product:", error);
    
    await cleanupCloudinaryImages(uploadedImages, authenticatedUserId);
    res.status(500).json({ success: false, message: "Failed to list product" });
  }
};

// Get All Products (With Search & Filters mapped to Schema)
export const getProducts = async (req, res) => {
  try {
    const { category, college, location, condition, search, price } = req.query;
    const { page, limit, skip } = getPaginationParams(req.query);
    const soldVisibleAfter = new Date(Date.now() - SOLD_VISIBLE_MS);

    const query = {};
    const andConditions = [
      {
        $or: [
        { status: "AVAILABLE" },
        { status: "SOLD_OUT", soldAt: { $gte: soldVisibleAfter } },
        ],
      },
    ];

    // Filters validation according to Schema fields
    if (category) query.category = category;
    
    if (college || location) {
      const selectedCollege = String(college || location).trim();

      if (!VALID_COLLEGE_FILTERS.has(selectedCollege)) {
        query.college = { $in: [] };
      } else if (selectedCollege === OTHER_COLLEGE) {
        query.college = { $nin: NAMED_COLLEGE_STORAGE_OPTIONS };
      } else {
        query.college = { $in: getCollegeFilterValues(selectedCollege) };
      }
    }
    
    if (condition) query.condition = condition;

    if (price === "Under ₹500") {
      query.price = { $lt: 500 };
    } else if (price === "₹500 - ₹1,000") {
      query.price = { $gte: 500, $lte: 1000 };
    } else if (price === "₹1,000 - ₹2,500") {
      query.price = { $gte: 1000, $lte: 2500 };
    } else if (price === "Above ₹2,500") {
      query.price = { $gt: 2500 };
    }

    const searchWords = getSearchWords(search);
    if (searchWords.length > 0) {
      andConditions.push({
        $or: searchWords.flatMap((word) => {
          const regex = escapeRegex(word);
          return [
            { title: { $regex: regex, $options: "i" } },
            { category: { $regex: regex, $options: "i" } },
          ];
        }),
      });
    }

    query.$and = andConditions;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("seller", PUBLIC_SELLER_SELECT)
        .lean(),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pagination: {
        page,
        limit,
        hasMore: skip + products.length < total,
      },
      data: products.map(formatPublicProduct),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching products",
      });
  }
};

export const getCategoryCounts = async (req, res) => {
  try {
    const soldVisibleAfter = new Date(Date.now() - SOLD_VISIBLE_MS);

    const counts = await Product.aggregate([
      {
        $match: {
          $or: [
            { status: "AVAILABLE" },
            { status: "SOLD_OUT", soldAt: { $gte: soldVisibleAfter } },
          ],
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: counts.length,
      data: counts,
    });
  } catch (error) {
    console.error("Error fetching category counts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching category counts",
    });
  }
};

// 3. Get Pending Products (Admin Only)
export const getPendingProducts = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [pendingProducts, total] = await Promise.all([
      Product.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("seller", "name username email mobileNumber")
        .lean(),
      Product.countDocuments({ status: "pending" }),
    ]);

    res.status(200).json({
      success: true,
      count: pendingProducts.length,
      total,
      pagination: {
        page,
        limit,
        hasMore: skip + pendingProducts.length < total,
      },
      data: pendingProducts,
    });
  } catch (error) {
    console.error("Error fetching pending products:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching pending products",
      });
  }
};

// 4. Update Product Status (Admin Only)
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, rejectionMessage } = req.body; 

    let finalStatus = "";
    const update = {};
    if (status === "approved") {
      finalStatus = "AVAILABLE";
      update.status = finalStatus;
      update.$unset = { rejectionMessage: "" };
    } else if (status === "rejected") {
      finalStatus = "rejected";
      const trimmedMessage = String(rejectionMessage || "").trim();
      if (!trimmedMessage) {
        return res
          .status(400)
          .json({ success: false, message: "Please provide a rejection message" });
      }
      update.status = finalStatus;
      update.rejectionMessage = trimmedMessage;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status update" });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      update,
      { returnDocument: "after" },
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (finalStatus === "rejected") {
      await releaseRejectedPromoUse(product);
    }

    res.status(200).json({
      success: true,
      message: `Product has been marked as ${finalStatus} successfully!`,
      data: product,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating status" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    // --- SMART AUTH EXTRACTION  ---
    let product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { views: 1 } },
      { returnDocument: "after" },
    ).populate("seller", PUBLIC_SELLER_SELECT);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Convert mongoose document to plain object to modify it safely
    const productData = formatPublicProduct(product);

    res.status(200).json({ success: true, data: productData });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getRecentProducts = async (req, res) => {
  try {
    const requestedIds = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const uniqueIds = [...new Set(
      requestedIds
        .map((id) => String(id || "").trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id)),
    )].slice(0, 4);

    if (uniqueIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const soldVisibleAfter = new Date(Date.now() - SOLD_VISIBLE_MS);
    const products = await Product.find({
      _id: { $in: uniqueIds },
      $or: [
        { status: "AVAILABLE" },
        { status: "SOLD_OUT", soldAt: { $gte: soldVisibleAfter } },
      ],
    }).populate("seller", PUBLIC_SELLER_SELECT).lean();

    const productsById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );
    const orderedProducts = uniqueIds
      .map((id) => productsById.get(id))
      .filter(Boolean);

    res.status(200).json({
      success: true,
      count: orderedProducts.length,
      data: orderedProducts.map(formatPublicProduct),
    });
  } catch (error) {
    console.error("Error fetching recent products:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recent products",
    });
  }
};

// GET MY LISTINGS: Fetch products posted by the logged-in user
export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 }).lean();
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your products" });
  }
};

export const markMyProductSold = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: "You can only update your own listings" });
    }

    if (!["AVAILABLE", "RESERVED"].includes(product.status)) {
      return res.status(400).json({ success: false, message: "Only approved listings can be marked as sold." });
    }

    product.status = "SOLD_OUT";
    product.soldAt = new Date();
    product.paymentDeadline = null;
    product.waitlist = [];
    await product.save();

    await markProductChatsForLifecycle({
      productId: product._id,
      status: "PRODUCT_SOLD",
      message: "This product has been marked as sold. This chat will be deleted after 3 days.",
    });

    await Offer.updateMany(
      { product: product._id, status: { $in: ["pending", "countered", "on_hold"] } },
      { status: "rejected" },
    );

    res.status(200).json({
      success: true,
      message: "Product marked as sold. It will stay visible as sold out for 24 hours.",
      data: product,
    });
  } catch (error) {
    console.error("Error marking product sold:", error);
    res.status(500).json({ success: false, message: "Failed to mark product as sold" });
  }
};

export const deleteMyProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own listings" });
    }

    if (!SELLER_DELETABLE_STATUSES.includes(product.status)) {
      return res.status(400).json({
        success: false,
        message: "Reserved or sold listings cannot be deleted.",
      });
    }

    await markProductChatsForLifecycle({
      productId: product._id,
      status: "PRODUCT_REMOVED",
      message: "This product has been removed by the seller. This chat will be deleted after 3 days.",
    });

    await cleanupCloudinaryImages(product.images, sellerId);
    await Offer.updateMany(
      { product: product._id, status: { $in: ["pending", "countered", "on_hold"] } },
      { status: "rejected" },
    );
    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Listing deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting user product:", error);
    res.status(500).json({ success: false, message: "Failed to delete listing" });
  }
};

export const deleteProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await markProductChatsForLifecycle({
      productId: product._id,
      status: "PRODUCT_REMOVED",
      message: "This product has been removed by an admin. This chat will be deleted after 3 days.",
    });

    await cleanupCloudinaryImages(product.images, product.seller);
    await Offer.updateMany(
      { product: product._id, status: { $in: ["pending", "countered", "on_hold"] } },
      { status: "rejected" },
    );
    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting product as admin:", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        const topProducts = await Product.find({
          status: 'AVAILABLE',
          isSold: { $ne: true}
        }) 
            .sort({ views: -1 })
            .limit(4)
            .lean();

        res.status(200).json(topProducts.map(formatPublicProduct));
    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json({ success: false, message: "Error fetching featured products" });
    }
};
