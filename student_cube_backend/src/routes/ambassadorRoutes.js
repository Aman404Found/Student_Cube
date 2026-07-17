import express from "express";
import {
  addAmbassadorPayoutAdmin,
  assignAmbassadorReferCodeAdmin,
  createAmbassadorAdmin,
  demoteAmbassadorAdmin,
  getAmbassadorDashboard,
  getAmbassadorsAdmin,
  searchUsersForAmbassadorAdmin,
} from "../controllers/ambassadorController.js";
import { protect, isAdmin, isAmbassador } from "../middlewares/authMiddleware.js";
import { adminLimiter, ambassadorServiceLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, isAmbassador, ambassadorServiceLimiter, getAmbassadorDashboard);
router.get("/admin", protect, isAdmin, ambassadorServiceLimiter, adminLimiter, getAmbassadorsAdmin);
router.get("/admin/user-search", protect, isAdmin, ambassadorServiceLimiter, adminLimiter, searchUsersForAmbassadorAdmin);
router.post("/admin", protect, isAdmin, ambassadorServiceLimiter, adminLimiter, createAmbassadorAdmin);
router.put("/admin/:ambassadorId/refer-code", protect, isAdmin, ambassadorServiceLimiter, adminLimiter, assignAmbassadorReferCodeAdmin);
router.put("/admin/:ambassadorId/demote", protect, isAdmin, ambassadorServiceLimiter, adminLimiter, demoteAmbassadorAdmin);
router.post("/admin/:ambassadorId/payouts", protect, isAdmin, ambassadorServiceLimiter, adminLimiter, addAmbassadorPayoutAdmin);

export default router;
