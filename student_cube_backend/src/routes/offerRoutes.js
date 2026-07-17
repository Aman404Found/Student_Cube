import express from 'express';
import {makeOffer,
        getProductOffers, 
        acceptOffer, 
        rejectOffer, 
        counterOffer,  
        getBuyerOffer,
        acceptCounterOffer,
        rejectCounterOffer,
        revokeOffer
    } from '../controllers/offerController.js';
import { protect, isAdmin } from '../middlewares/authMiddleware.js'; 
import { adminLimiter, offerCreateLimiter, offerServiceLimiter, paymentLimiter } from '../middlewares/rateLimitMiddleware.js';
import { submitPaymentProof, verifyPaymentAdmin } from '../controllers/offerController.js';
import { getMyOffersList } from '../controllers/offerController.js';

import { getPendingPaymentsAdmin } from '../controllers/offerController.js';

const router = express.Router();

router.post('/make', protect, offerServiceLimiter, offerCreateLimiter, makeOffer);
router.post('/payment/submit-proof', protect, offerServiceLimiter, paymentLimiter, submitPaymentProof);

router.get('/product/:productId', protect, offerServiceLimiter, getProductOffers);
router.get('/admin/payments/pending', protect, isAdmin, offerServiceLimiter, adminLimiter, getPendingPaymentsAdmin);

router.get('/my-offers', protect, offerServiceLimiter, getMyOffersList);

router.put('/accept/:id', protect, offerServiceLimiter, acceptOffer);
router.put('/reject/:id', protect, offerServiceLimiter, rejectOffer);
router.put('/counter/:id', protect, offerServiceLimiter, counterOffer);

router.put('/admin/payment/verify/:offerId', protect, isAdmin, offerServiceLimiter, adminLimiter, verifyPaymentAdmin);

router.get('/my-offer/:productId', protect, offerServiceLimiter, getBuyerOffer);
router.put('/buyer/accept-counter/:id', protect, offerServiceLimiter, acceptCounterOffer);
router.put('/buyer/reject-counter/:id', protect, offerServiceLimiter, rejectCounterOffer);
router.put('/buyer/revoke/:id', protect, offerServiceLimiter, revokeOffer);

export default router;
