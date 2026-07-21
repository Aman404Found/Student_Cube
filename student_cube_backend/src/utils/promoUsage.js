import Product from "../models/Product.js";
import ReferCode from "../models/ReferCode.js";
import User from "../models/User.js";

const usedPromoProductQuery = (sellerId) => ({
  seller: sellerId,
  appliedPromoCode: { $nin: [null, ""] },
  status: { $ne: "rejected" },
});

export const hasConsumedPromoBenefit = async (sellerId) => {
  if (!sellerId) return false;

  const [successfulReferral, activePromoProduct] = await Promise.all([
    ReferCode.exists({
      "referredUsers.uid": sellerId,
      "referredUsers.status": "successful",
    }),
    Product.exists(usedPromoProductQuery(sellerId)),
  ]);
  
  return Boolean(successfulReferral || activePromoProduct);
};
export const releaseRejectedPromoUse = async (product) => {
  if (!product?.appliedPromoCode || !product?.seller) return;

  await ReferCode.updateOne(
    {
      code: product.appliedPromoCode,
      "referredUsers.productId": product._id,
    },
    {
      $set: {
        "referredUsers.$.status": "rejected",
      },
    },
  );

  const stillConsumed = await hasConsumedPromoBenefit(product.seller);
  if (!stillConsumed) {
    await User.updateOne(
      { _id: product.seller },
      { $unset: { referCodeUsed: "" } },
    );
  }
};
