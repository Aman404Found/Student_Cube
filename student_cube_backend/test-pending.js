import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Product = (await import('./src/models/Product.js')).default;
  const count = await Product.countDocuments({ status: "pending" });
  console.log("Pending products count:", count);
  process.exit(0);
});
