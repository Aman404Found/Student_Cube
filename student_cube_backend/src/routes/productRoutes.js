import express from 'express';
import { createProduct, getProducts, getProductById, getPendingProducts, updateProductStatus, getMyProducts, deleteMyProduct, deleteProductAdmin, markMyProductSold, getFeaturedProducts, getUploadSignature, getRecentProducts, getCategoryCounts, updateProduct } from '../controllers/productController.js';
import { protect, isAdmin } from '../middlewares/authMiddleware.js';
import { adminLimiter, productCreateLimiter, productServiceLimiter, uploadSignatureLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.post('/upload-signature', protect, productServiceLimiter, uploadSignatureLimiter, getUploadSignature);
router.post('/recent', productServiceLimiter, getRecentProducts);
router.post('/', protect, productServiceLimiter, productCreateLimiter, createProduct);

router.get('/', productServiceLimiter, getProducts);
router.get('/all', productServiceLimiter, getProducts);
router.get('/category-counts', productServiceLimiter, getCategoryCounts);
router.get('/my-listings', protect, productServiceLimiter, getMyProducts);
router.get('/featured', productServiceLimiter, getFeaturedProducts);
router.get('/admin/pending', protect, isAdmin, productServiceLimiter, adminLimiter, getPendingProducts);

router.put('/admin/status/:id', protect, isAdmin, productServiceLimiter, adminLimiter, updateProductStatus);
router.delete('/admin/:id', protect, isAdmin, productServiceLimiter, adminLimiter, deleteProductAdmin);
router.put('/:id/mark-sold', protect, productServiceLimiter, markMyProductSold);
router.delete('/:id', protect, productServiceLimiter, deleteMyProduct);
router.put('/:id', protect, productServiceLimiter, updateProduct);
router.get('/:id', productServiceLimiter, getProductById); 

export default router;
