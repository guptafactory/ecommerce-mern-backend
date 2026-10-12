import crypto from "crypto";

import { razorpayInstance } from "../app.js";
import Coupon from "../models/payment.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/error-handler.js";

export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount))
    return next(new ErrorHandler("Invalid amount details", 400));

  const options = {
    amount: amount * 100,
    currency: "INR",
  };

  const order = await razorpayInstance.orders.create(options);

  if (!order) {
    return next(new ErrorHandler("Unable to create Payment Intent", 500));
  }

  res.status(200).json({
    success: true,
    message: "Payment intent created successfully",
    order,
  });
});

export const getRazorpayKey = TryCatch(async (req, res, next) => {
  if (!process.env.RAZORPAY_KEY_ID)
    return next(
      new ErrorHandler("Internal server error: Missing configuration", 500),
    );

  return res.status(200).json({
    success: true,
    message: "Razorpay key ID fetched successfully",
    key: process.env.RAZORPAY_KEY_ID,
  });
});

export const verifyPayment = TryCatch(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return next(
      new ErrorHandler("Invalid request: Missing required fields", 400),
    );
  }

  if (!process.env.RAZORPAY_KEY_SECRET)
    return next(
      new ErrorHandler("Internal server error: Missing configuration", 500),
    );

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthenticated = razorpay_signature === expectedSignature;

  if (!isAuthenticated)
    return next(
      new ErrorHandler("Payment verification failed: Signature mismatch", 400),
    );

  return res.status(200).json({
    success: true,
    message: "Payment verified successfully",
  });
});

// Coupons
export const createNewCoupon = TryCatch(async (req, res, next) => {
  const { code, amount } = req.body;

  if (!code || !amount || isNaN(amount)) {
    return next(new ErrorHandler("Provide valid coupon details", 400));
  }

  const coupon = await Coupon.create({
    code,
    amount: Number(amount),
  });

  return res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    coupon,
  });
});

export const updateCouponById = TryCatch(async (req, res, next) => {
  const { id: couponId } = req.params;
  const { amount } = req.body;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new ErrorHandler("Coupon not found", 404));

  if (!amount || isNaN(amount))
    return next(new ErrorHandler("Invalid coupon amount details", 400));

  coupon.amount = amount;
  await coupon.save();

  return res.status(200).json({
    success: true,
    message: "Coupon details updated successfully",
    coupon,
  });
});

export const deleteCouponById = TryCatch(async (req, res, next) => {
  const { id: couponId } = req.params;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new ErrorHandler("Coupon not found", 404));

  await coupon.deleteOne();

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} deleted successfully`,
  });
});

export const getCouponById = TryCatch(async (req, res, next) => {
  const { id: couponId } = req.params;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new ErrorHandler("Coupon not found", 404));

  return res.status(200).json({
    success: true,
    message: "Coupon details fetched successfully",
    coupon,
  });
});

export const getAllCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find();

  return res.status(200).json({
    success: true,
    message: "All coupon(s) details fetched successfully",
    coupons,
  });
});

// Discount
export const applyDiscount = TryCatch(async (req, res, next) => {
  const code = req.query.coupon as string;

  const coupon = await Coupon.findOne({ code });

  if (!coupon) return next(new ErrorHandler("Coupon not found", 404));

  return res.status(200).json({
    success: true,
    message: "Discount applied successfully",
    discount: coupon?.amount,
  });
});
