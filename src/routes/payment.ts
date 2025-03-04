import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import {
  applyDiscount,
  createNewCoupon,
  createPaymentIntent,
  deleteCouponById,
  getAllCoupons,
  getCouponById,
  updateCouponById,
} from "../controllers/payment.js";

const router = express.Router();

// /api/v1/payment/create
router.post("/create", adminOnly, createPaymentIntent);

// /api/v1/payment/coupon/new
router.post("/coupon/new", adminOnly, createNewCoupon);

// /api/v1/payment/coupon/all
router.get("/coupon/all", adminOnly, getAllCoupons);

// /api/v1/payment/coupon/dynamic_id
router
  .route("/coupon/:id")
  .get(getCouponById)
  .put(adminOnly, updateCouponById)
  .delete(adminOnly, deleteCouponById);

// /api/v1/payment/discount
router.get("/discount", applyDiscount);

export default router;
