import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://studentcube:studentcube@studentcube.mongodb.net/test?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGO_URI);
  const Product = mongoose.connection.collection("products");
  
  // Find a product
  const product = await Product.findOne({});
  if (!product) {
    console.log("No products found.");
    process.exit(0);
  }

  const userId = product.seller.toString();
  const token = jwt.sign({ id: userId, role: "user" }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
  
  console.log("PRODUCT_ID=" + product._id.toString());
  console.log("TOKEN=" + token);
  
  process.exit(0);
}

main();
